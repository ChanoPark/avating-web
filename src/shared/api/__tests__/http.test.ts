import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { server } from '@shared/mocks/server';
import { http as mswHttp, HttpResponse } from 'msw';
import { configureHttpAuth, resetHttpAuth, type RefreshedTokenPayload } from '../http';

const BASE_URL = 'http://localhost:8080';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
};

function makeAdapter(initial: Partial<AuthState> = {}) {
  const state: AuthState = {
    accessToken: initial.accessToken ?? null,
    refreshToken: initial.refreshToken ?? null,
  };
  const onUnauthorized = vi.fn(() => {
    state.accessToken = null;
    state.refreshToken = null;
  });
  const onTokenRefreshed = vi.fn((payload: RefreshedTokenPayload) => {
    state.accessToken = payload.accessToken;
    state.refreshToken = payload.refreshToken;
  });
  return {
    state,
    onUnauthorized,
    onTokenRefreshed,
    install: () => {
      configureHttpAuth({
        getAccessToken: () => state.accessToken,
        getRefreshToken: () => state.refreshToken,
        onTokenRefreshed,
        onUnauthorized,
      });
    },
  };
}

describe('http 인터셉터 — 요청', () => {
  beforeEach(() => {
    resetHttpAuth();
  });

  afterEach(() => {
    resetHttpAuth();
  });

  it('accessToken이 없으면 Authorization 헤더를 추가하지 않는다', async () => {
    const adapter = makeAdapter();
    adapter.install();

    let receivedAuthHeader: string | null = null;

    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, ({ request }) => {
        receivedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      })
    );

    const { http } = await import('../http');
    await http.get('/api/protected');

    expect(receivedAuthHeader).toBeNull();
  });

  it('accessToken이 있으면 Authorization: Bearer 헤더를 추가한다', async () => {
    const adapter = makeAdapter({ accessToken: 'access-token-value' });
    adapter.install();

    let receivedAuthHeader: string | null = null;

    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, ({ request }) => {
        receivedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      })
    );

    const { http } = await import('../http');
    await http.get('/api/protected');

    expect(receivedAuthHeader).toBe('Bearer access-token-value');
  });

  it('allowlist 경로(/api/auth/login)는 토큰이 있어도 Authorization 헤더를 추가하지 않는다', async () => {
    const adapter = makeAdapter({ accessToken: 'access-token-value' });
    adapter.install();

    let receivedAuthHeader: string | null = null;

    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/login`, ({ request }) => {
        receivedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({
          data: { accessToken: 'new', refreshToken: 'new', tokenType: 'Bearer', expiresIn: 3600 },
        });
      })
    );

    const { http } = await import('../http');
    await http.post('/api/auth/login', {});

    expect(receivedAuthHeader).toBeNull();
  });

  it('allowlist 경로(/api/auth/signup)는 토큰이 있어도 Authorization 헤더를 추가하지 않는다', async () => {
    const adapter = makeAdapter({ accessToken: 'access-token-value' });
    adapter.install();

    let receivedAuthHeader: string | null = null;

    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/signup`, ({ request }) => {
        receivedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({
          data: { accessToken: 'new', refreshToken: 'new', tokenType: 'Bearer', expiresIn: 3600 },
        });
      })
    );

    const { http } = await import('../http');
    await http.post('/api/auth/signup', {});

    expect(receivedAuthHeader).toBeNull();
  });

  it('allowlist 경로(/api/crypto/public-key)는 Authorization 헤더를 추가하지 않는다', async () => {
    const adapter = makeAdapter({ accessToken: 'access-token-value' });
    adapter.install();

    let receivedAuthHeader: string | null = null;

    server.use(
      mswHttp.get(`${BASE_URL}/api/crypto/public-key`, ({ request }) => {
        receivedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({ data: { publicKey: 'KEY' } });
      })
    );

    const { http } = await import('../http');
    await http.get('/api/crypto/public-key');

    expect(receivedAuthHeader).toBeNull();
  });
});

describe('http 인터셉터 — 응답 에러', () => {
  beforeEach(() => {
    resetHttpAuth();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetHttpAuth();
  });

  it('401 응답이 오고 refreshToken이 없으면 onUnauthorized가 호출되고 ApiError를 reject한다', async () => {
    const adapter = makeAdapter({ accessToken: 'expired-token' });
    adapter.install();

    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    const { http } = await import('../http');

    await expect(http.get('/api/protected')).rejects.toMatchObject({
      statusCode: expect.any(Number),
    });

    expect(adapter.onUnauthorized).toHaveBeenCalled();
    expect(adapter.state.accessToken).toBeNull();
  });

  it('401 응답이 오고 refreshToken이 있으면 토큰을 갱신하고 요청을 재시도한다', async () => {
    const adapter = makeAdapter({
      accessToken: 'old-access-token',
      refreshToken: 'refresh-token-value',
    });
    adapter.install();

    let callCount = 0;

    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json({ data: 'ok' });
      }),
      mswHttp.post(`${BASE_URL}/api/auth/refresh`, () => {
        return HttpResponse.json({
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            tokenType: 'Bearer',
            expiresIn: 3600,
          },
        });
      })
    );

    const { http } = await import('../http');
    const response = await http.get('/api/protected');

    expect(response.data).toEqual({ data: 'ok' });
    expect(adapter.onTokenRefreshed).toHaveBeenCalledOnce();
    expect(adapter.state.accessToken).toBe('new-access-token');
  });

  it('401 응답이지만 allowlist 경로(/api/auth/refresh)면 재시도하지 않고 ApiError를 reject한다', async () => {
    const adapter = makeAdapter();
    adapter.install();

    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/refresh`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    const { http } = await import('../http');

    await expect(http.post('/api/auth/refresh', {})).rejects.toBeDefined();
  });

  it('401이 아닌 에러(403)는 ApiError로 변환하여 reject한다', async () => {
    const adapter = makeAdapter();
    adapter.install();

    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, () => {
        return HttpResponse.json({ message: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
      })
    );

    const { http } = await import('../http');

    await expect(http.get('/api/protected')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Forbidden',
      code: 'FORBIDDEN',
    });
  });

  it('500 에러는 ApiError로 변환된다', async () => {
    const adapter = makeAdapter();
    adapter.install();

    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, () => {
        return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
      })
    );

    const { http } = await import('../http');

    await expect(http.get('/api/protected')).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});
