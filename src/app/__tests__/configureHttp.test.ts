import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureHttpAuth, resetHttpAuth } from '@shared/api/http';
import type { HttpAuthAdapter, RefreshedTokenPayload } from '@shared/api/http';
import { configureHttp } from '../configureHttp';
import { useAuthStore } from '@entities/auth/store';

vi.mock('@shared/api/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/api/http')>();
  return {
    ...actual,
    configureHttpAuth: vi.fn(),
  };
});

describe('configureHttp', () => {
  beforeEach(() => {
    resetHttpAuth();
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      expiresAt: null,
    });
  });

  function captureAdapter(): HttpAuthAdapter {
    configureHttp();
    expect(configureHttpAuth).toHaveBeenCalledOnce();
    return vi.mocked(configureHttpAuth).mock.calls[0]![0];
  }

  it('configureHttp() 가 configureHttpAuth 를 1회 호출한다', () => {
    configureHttp();
    expect(configureHttpAuth).toHaveBeenCalledOnce();
  });

  it('getAccessToken 콜백이 authStore 의 accessToken 을 반환한다', () => {
    useAuthStore.setState({ accessToken: 'my-access-token' });
    const adapter = captureAdapter();
    expect(adapter.getAccessToken()).toBe('my-access-token');
  });

  it('getAccessToken 이 null 이면 null 을 반환한다', () => {
    const adapter = captureAdapter();
    expect(adapter.getAccessToken()).toBeNull();
  });

  it('getRefreshToken 콜백이 authStore 의 refreshToken 을 반환한다', () => {
    useAuthStore.setState({ refreshToken: 'my-refresh-token' });
    const adapter = captureAdapter();
    expect(adapter.getRefreshToken()).toBe('my-refresh-token');
  });

  it('onTokenRefreshed 콜백이 authStore.setToken 을 호출한다', () => {
    const setToken = vi.fn();
    useAuthStore.setState({ setToken } as unknown as Parameters<typeof useAuthStore.setState>[0]);

    const adapter = captureAdapter();
    const payload: RefreshedTokenPayload = {
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
    };

    adapter.onTokenRefreshed(payload);
    expect(setToken).toHaveBeenCalledWith(payload);
  });

  it('onUnauthorized 콜백이 authStore.clear 를 호출한다', () => {
    const clear = vi.fn();
    useAuthStore.setState({ clear } as unknown as Parameters<typeof useAuthStore.setState>[0]);

    const adapter = captureAdapter();
    adapter.onUnauthorized();
    expect(clear).toHaveBeenCalledOnce();
  });
});
