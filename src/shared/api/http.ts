import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '@shared/config/env';
import { ApiError, parseApiError } from '@shared/lib/errors';

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

export type RefreshedTokenPayload = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type HttpAuthAdapter = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokenRefreshed: (payload: RefreshedTokenPayload) => void;
  onUnauthorized: () => void;
};

const noopAdapter: HttpAuthAdapter = {
  getAccessToken: () => null,
  getRefreshToken: () => null,
  onTokenRefreshed: () => undefined,
  onUnauthorized: () => undefined,
};

let authAdapter: HttpAuthAdapter = noopAdapter;

export function configureHttpAuth(adapter: HttpAuthAdapter): void {
  authAdapter = adapter;
}

export function resetHttpAuth(): void {
  authAdapter = noopAdapter;
}

export const http: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshInflight: Promise<string> | null = null;

// refresh 를 부르는 유일한 통로다 — 서버가 rotation + 회원당 1개 refresh token 만 허용해서,
// 401 인터셉터와 부팅 복구가 각자 부르면 나중 호출이 AUTH_401_006 으로 죽는다. 둘 다 이
// 함수를 거쳐 in-flight 를 공유해야 한다.
export function refreshAccessToken(): Promise<string> {
  if (refreshInflight) {
    return refreshInflight;
  }

  const refreshToken = authAdapter.getRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new ApiError(401, 'No refresh token'));
  }

  refreshInflight = axios
    .post<{ data: RefreshedTokenPayload }>(`${env.VITE_API_BASE_URL}/api/auth/refresh`, {
      refreshToken,
    })
    .then((res) => {
      authAdapter.onTokenRefreshed(res.data.data);
      return res.data.data.accessToken;
    })
    .finally(() => {
      refreshInflight = null;
    });

  return refreshInflight;
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authAdapter.getAccessToken();

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
        const newToken = await refreshAccessToken();
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return await http(originalConfig);
      } catch (refreshError) {
        authAdapter.onUnauthorized();
        return Promise.reject(parseApiError(refreshError));
      }
    }

    return Promise.reject(parseApiError(error));
  }
);
