import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { useAuthStore } from '@entities/auth/store';
import { resetHttpAuth } from '@shared/api/http';
import { configureHttp } from '../configureHttp';
import { bootstrapAuth } from '../bootstrapAuth';

const BASE_URL = 'http://localhost:8080';

const REFRESHED = {
  accessToken: 'refreshed-access-token',
  refreshToken: 'rotated-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

function refreshHandler(counter: { calls: number }) {
  return mswHttp.post(`${BASE_URL}/api/auth/refresh`, () => {
    counter.calls += 1;
    return HttpResponse.json({ data: REFRESHED });
  });
}

describe('bootstrapAuth — 새로고침 후 세션 복구', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clear();
    configureHttp();
  });

  afterEach(() => {
    resetHttpAuth();
  });

  it('유효한 accessToken 이 남아 있으면 refresh 없이 authenticated 로 확정한다', async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter));

    useAuthStore.getState().setToken({
      accessToken: 'still-valid',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });

    await bootstrapAuth();

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().accessToken).toBe('still-valid');
    expect(counter.calls).toBe(0);
  });

  it('refreshToken 이 없으면 anonymous 로 확정한다', async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter));

    await bootstrapAuth();

    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(counter.calls).toBe(0);
  });

  it('accessToken 이 만료됐고 refreshToken 이 살아 있으면 refresh 로 세션을 복구한다', async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter));

    useAuthStore.getState().setToken({
      accessToken: 'expired-access-token',
      refreshToken: 'live-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    useAuthStore.setState({ expiresAt: Date.now() - 1, status: 'restoring' });

    await bootstrapAuth();

    expect(counter.calls).toBe(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().accessToken).toBe('refreshed-access-token');
    expect(useAuthStore.getState().refreshToken).toBe('rotated-refresh-token');
  });

  it('refresh 가 실패하면 세션을 비우고 anonymous 로 확정한다', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/refresh`, () =>
        HttpResponse.json({ code: 'AUTH_401_006', message: '만료된 토큰' }, { status: 401 })
      )
    );

    useAuthStore.getState().setToken({
      accessToken: 'expired-access-token',
      refreshToken: 'dead-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    useAuthStore.setState({ expiresAt: Date.now() - 1, status: 'restoring' });

    await bootstrapAuth();

    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('동시에 두 번 호출돼도 refresh 는 한 번만 나간다 (StrictMode 이중 실행 대비)', async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter));

    useAuthStore.getState().setToken({
      accessToken: 'expired-access-token',
      refreshToken: 'live-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    useAuthStore.setState({ expiresAt: Date.now() - 1, status: 'restoring' });

    await Promise.all([bootstrapAuth(), bootstrapAuth()]);

    expect(counter.calls).toBe(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });
});
