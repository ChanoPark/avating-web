import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '@shared/config/env';
import { parseApiError } from '@shared/lib/errors';
import { useAuthStore } from '@entities/auth/store';

const AUTH_ALLOWLIST = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/crypto/public-key',
  '/api/auth/refresh',
];

function isAllowlisted(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ALLOWLIST.some((path) => url.includes(path));
}

export const http: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshInflight: Promise<string> | null = null;

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;

  if (token && !isAllowlisted(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    const axiosError = error as import('axios').AxiosError & {
      config?: InternalAxiosRequestConfig & { _retry?: boolean };
    };

    const status = axiosError.response?.status;
    const originalConfig = axiosError.config;
    const isRefreshEndpoint = isAllowlisted(originalConfig?.url);

    if (status === 401 && originalConfig && !isRefreshEndpoint && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        if (!refreshInflight) {
          const refreshToken = useAuthStore.getState().refreshToken;

          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          refreshInflight = axios
            .post<{
              data: {
                accessToken: string;
                refreshToken: string;
                tokenType: string;
                expiresIn: number;
              };
            }>(`${env.VITE_API_BASE_URL}/api/auth/refresh`, { refreshToken })
            .then((res) => {
              useAuthStore.getState().setToken(res.data.data);
              return res.data.data.accessToken;
            })
            .finally(() => {
              refreshInflight = null;
            });
        }

        const newToken = await refreshInflight;
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return await http(originalConfig);
      } catch {
        useAuthStore.getState().clear();
        refreshInflight = null;
        return Promise.reject(parseApiError(error));
      }
    }

    return Promise.reject(parseApiError(error));
  }
);
