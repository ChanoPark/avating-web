import { configureHttpAuth } from '@shared/api/http';
import { useAuthStore } from '@entities/auth/store';

export function configureHttp(): void {
  configureHttpAuth({
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    onTokenRefreshed: (payload) => {
      useAuthStore.getState().setToken(payload);
    },
    onUnauthorized: () => {
      useAuthStore.getState().clear();
    },
  });
}
