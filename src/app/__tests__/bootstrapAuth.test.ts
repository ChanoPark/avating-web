import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { useAuthStore } from '@entities/auth/store';
import { resetHttpAuth } from '@shared/api/http';
import { configureHttp } from '../configureHttp';
import { bootstrapAuth } from '../bootstrapAuth';

const BASE_URL = 'http://localhost:8080';

const SESSION = { email: 'coach@avating.app', nickname: '코치' };

const REFRESHED = {
  accessToken: 'refreshed-access-token',
  refreshToken: 'rotated-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

type Counter = { calls: number };

/** 저장된 accessToken 을 그대로 인정하는 서버. */
function meOk(counter: Counter) {
  return mswHttp.get(`${BASE_URL}/api/auth/me`, () => {
    counter.calls += 1;
    return HttpResponse.json({ data: SESSION });
  });
}

/** 재발급된 토큰만 인정하는 서버 — 저장된 accessToken 은 모른다(서버 재기동·회수). */
function meAcceptsRefreshedOnly(counter: Counter) {
  return mswHttp.get(`${BASE_URL}/api/auth/me`, ({ request }) => {
    counter.calls += 1;
    if (request.headers.get('Authorization') === `Bearer ${REFRESHED.accessToken}`) {
      return HttpResponse.json({ data: SESSION });
    }
    return HttpResponse.json({ code: 'AUTH_401_001', message: '만료된 토큰' }, { status: 401 });
  });
}

/** 어떤 토큰도 인정하지 않는 서버. */
function meUnauthorized(counter: Counter) {
  return mswHttp.get(`${BASE_URL}/api/auth/me`, () => {
    counter.calls += 1;
    return HttpResponse.json({ code: 'AUTH_401_001', message: '만료된 토큰' }, { status: 401 });
  });
}

function refreshOk(counter: Counter) {
  return mswHttp.post(`${BASE_URL}/api/auth/refresh`, () => {
    counter.calls += 1;
    return HttpResponse.json({ data: REFRESHED });
  });
}

function refreshRejected(counter: Counter) {
  return mswHttp.post(`${BASE_URL}/api/auth/refresh`, () => {
    counter.calls += 1;
    return HttpResponse.json(
      { code: 'AUTH_401_006', message: '서버에 저장된 Refresh Token 없음' },
      { status: 401 }
    );
  });
}

/** 로컬 기준으로는 아직 유효한 세션을 심는다. */
function seedLiveSession() {
  useAuthStore.getState().setToken({
    accessToken: 'stored-access-token',
    refreshToken: 'stored-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
  });
  useAuthStore.setState({ status: 'restoring' });
}

describe('bootstrapAuth — 부팅 시 서버 검증', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clear();
    configureHttp();
  });

  afterEach(() => {
    resetHttpAuth();
  });

  it('저장된 세션이 없으면 네트워크 없이 anonymous 로 확정한다', async () => {
    const me = { calls: 0 };
    const refresh = { calls: 0 };
    server.use(meOk(me), refreshOk(refresh));

    await bootstrapAuth();

    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(me.calls).toBe(0);
    expect(refresh.calls).toBe(0);
  });

  it('로컬 기준 유효한 accessToken 이어도 서버에 세션을 확인한다', async () => {
    const me = { calls: 0 };
    const refresh = { calls: 0 };
    server.use(meOk(me), refreshOk(refresh));
    seedLiveSession();

    await bootstrapAuth();

    expect(me.calls).toBe(1);
    expect(refresh.calls).toBe(0);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().accessToken).toBe('stored-access-token');
  });

  it('검증 왕복 중에 로컬 만료 시각이 지나도 authenticated 를 유지한다', async () => {
    // 서버가 방금 인정한 세션이다. 여기서 anonymous 로 내리면 새로고침이 곧 로그아웃이 된다.
    server.use(
      mswHttp.get(`${BASE_URL}/api/auth/me`, () => {
        useAuthStore.setState({ expiresAt: Date.now() - 1 });
        return HttpResponse.json({ data: SESSION });
      })
    );
    seedLiveSession();

    await bootstrapAuth();

    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('서버가 저장된 accessToken 을 거부하면 refresh 로 복구해 authenticated 로 확정한다', async () => {
    const me = { calls: 0 };
    const refresh = { calls: 0 };
    server.use(meAcceptsRefreshedOnly(me), refreshOk(refresh));
    seedLiveSession();

    await bootstrapAuth();

    expect(refresh.calls).toBe(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().accessToken).toBe(REFRESHED.accessToken);
    expect(useAuthStore.getState().refreshToken).toBe(REFRESHED.refreshToken);
  });

  it('서버가 세션을 모르고 refresh 도 거절하면 세션을 비우고 anonymous 로 확정한다', async () => {
    const me = { calls: 0 };
    const refresh = { calls: 0 };
    server.use(meUnauthorized(me), refreshRejected(refresh));
    seedLiveSession();

    await bootstrapAuth();

    expect(me.calls).toBe(1);
    expect(refresh.calls).toBe(1);
    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(localStorage.getItem('avating-auth')).not.toContain('stored-refresh-token');
  });

  it('accessToken 만 만료된 상태면 refresh 로 복구한다', async () => {
    const me = { calls: 0 };
    const refresh = { calls: 0 };
    server.use(meAcceptsRefreshedOnly(me), refreshOk(refresh));
    seedLiveSession();
    useAuthStore.setState({ expiresAt: Date.now() - 1 });

    await bootstrapAuth();

    expect(refresh.calls).toBe(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().accessToken).toBe(REFRESHED.accessToken);
  });

  it('서버에 닿지 못하면 세션을 지우지 않고 로컬 판정을 유지한다', async () => {
    server.use(mswHttp.get(`${BASE_URL}/api/auth/me`, () => HttpResponse.error()));
    seedLiveSession();

    await bootstrapAuth();

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().refreshToken).toBe('stored-refresh-token');
  });

  it('서버가 500 을 주면 세션을 지우지 않는다 — 끊긴 세션이 아니라 고장난 서버다', async () => {
    server.use(
      mswHttp.get(`${BASE_URL}/api/auth/me`, () =>
        HttpResponse.json({ message: '서버 오류' }, { status: 500 })
      )
    );
    seedLiveSession();

    await bootstrapAuth();

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().refreshToken).toBe('stored-refresh-token');
  });

  it('서버에 닿지 못하고 accessToken 도 만료됐으면 anonymous 로 떨어뜨린다', async () => {
    server.use(
      mswHttp.get(`${BASE_URL}/api/auth/me`, () => HttpResponse.error()),
      mswHttp.post(`${BASE_URL}/api/auth/refresh`, () => HttpResponse.error())
    );
    seedLiveSession();
    useAuthStore.setState({ expiresAt: Date.now() - 1 });

    await bootstrapAuth();

    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(useAuthStore.getState().refreshToken).toBe('stored-refresh-token');
  });

  it('동시에 두 번 호출돼도 refresh 는 한 번만 나간다 (StrictMode 이중 실행 대비)', async () => {
    const me = { calls: 0 };
    const refresh = { calls: 0 };
    server.use(meAcceptsRefreshedOnly(me), refreshOk(refresh));
    seedLiveSession();

    await Promise.all([bootstrapAuth(), bootstrapAuth()]);

    expect(refresh.calls).toBe(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });
});
