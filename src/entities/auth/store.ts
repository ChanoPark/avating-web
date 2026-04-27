import { create } from 'zustand';
import type { AuthTokenResponse } from './model';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  expiresAt: number | null;
  setToken: (payload: AuthTokenResponse) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  accessToken: null,
  refreshToken: null,
  tokenType: null,
  expiresAt: null,

  setToken: (payload: AuthTokenResponse) => {
    const expiresAt = Date.now() + payload.expiresIn * 1000;
    set({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      tokenType: payload.tokenType,
      expiresAt,
    });
  },

  clear: () => {
    set({
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      expiresAt: null,
    });
  },

  isAuthenticated: () => {
    const { accessToken, expiresAt } = get();
    if (!accessToken) return false;
    if (expiresAt === null) return false;
    return Date.now() < expiresAt;
  },
}));
