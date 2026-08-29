import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { AuthTokenResponse } from './model';

/** localStorage 가 막혀도(프라이빗 모드 등) 로그인은 성공해야 한다 — 실패해도 setToken() 은 던지지 않는다. */
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

/** 세션 복구 3-상태 — `restoring` 중에 `/login` 으로 보내면 새로고침 한 번에 로그아웃된다. */
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
 * accessToken 까지 영속화한다 — refreshToken 만 저장하면 rotation 정책(회원당 1개) 탓에 탭 두 개를 열었을 때 한쪽이 `AUTH_401_006` 으로 로그아웃된다.
 * 저장된 `expiresAt` 은 신뢰하지 않는다 — 서버 재기동·토큰 회수를 알 수 없으므로 부팅 판정은 `bootstrapAuth()` 가 서버에 물어서 한다.
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
