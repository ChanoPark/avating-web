import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { AuthTokenResponse } from './model';

/**
 * localStorage 접근이 막혀도(사파리 프라이빗 모드·용량 초과) 로그인 자체는 성공해야 한다.
 * 영속화는 부가 기능이라, 실패하면 "새로고침을 못 넘긴다" 로 끝나야지 setToken() 이 던지면 안 된다.
 */
const guardedLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      console.warn('[auth] 세션 영속화 실패 — 새로고침하면 로그아웃된다');
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // 지울 수 없으면 그대로 둔다. 만료 토큰은 부팅 복구에서 걸러진다.
    }
  },
};

/**
 * 세션 복구 3-상태.
 * - `restoring`: 부팅 직후, 저장된 refreshToken 으로 복구를 시도할 수 있는 구간.
 *   이때 `/login` 으로 튕기면 새로고침 한 번에 로그아웃되는 것과 같다 (실서버 QA S1).
 * - `authenticated` / `anonymous`: 판정이 끝난 상태.
 */
export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  expiresAt: number | null;
  status: AuthStatus;
  setToken: (payload: AuthTokenResponse) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
};

export const AUTH_STORAGE_KEY = 'avating-auth';

/**
 * accessToken 까지 함께 영속화한다.
 * refreshToken 만 저장하고 부팅마다 refresh 로 access 를 복구하는 안(계획서 A1-(b))은
 * 서버가 refresh token rotation + 회원당 1개를 쓰기 때문에 탭을 두 개 열면
 * 한쪽이 `AUTH_401_006` 으로 로그아웃된다. 어차피 refreshToken 이 localStorage 에 있어
 * XSS 노출면도 실질적으로 같아 이득이 없다.
 *
 * 다만 **저장한 값을 그대로 믿지는 않는다.** `expiresAt` 은 우리가 계산한 시각이라 서버
 * 재기동·토큰 회수를 모르므로, 부팅 판정은 `bootstrapAuth()` 가 서버에 물어서 한다.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      expiresAt: null,
      status: 'restoring',

      setToken: (payload: AuthTokenResponse) => {
        const expiresAt = Date.now() + payload.expiresIn * 1000;
        set({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          tokenType: payload.tokenType,
          expiresAt,
          status: 'authenticated',
        });
      },

      setStatus: (status: AuthStatus) => {
        set({ status });
      },

      clear: () => {
        set({
          accessToken: null,
          refreshToken: null,
          tokenType: null,
          expiresAt: null,
          status: 'anonymous',
        });
      },

      isAuthenticated: () => {
        const { accessToken, expiresAt } = get();
        if (!accessToken) return false;
        if (expiresAt === null) return false;
        return Date.now() < expiresAt;
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => guardedLocalStorage),
      // status 는 매 부팅마다 다시 판정한다 — 저장하면 만료된 세션이 authenticated 로 되살아난다.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenType: state.tokenType,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
