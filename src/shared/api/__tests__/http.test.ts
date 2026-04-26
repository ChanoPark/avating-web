import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { server } from '@shared/mocks/server';
import { http as mswHttp, HttpResponse } from 'msw';
import { useAuthStore } from '@entities/auth/store';

const BASE_URL = 'http://localhost:8080';

const mockToken = {
  accessToken: 'access-token-value',
  refreshToken: 'refresh-token-value',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

describe('http 인터셉터 — 요청', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
  });

  it('accessToken이 없으면 Authorization 헤더를 추가하지 않는다', async () => {
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
    useAuthStore.getState().setToken(mockToken);

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
    useAuthStore.getState().setToken(mockToken);

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
    useAuthStore.getState().setToken(mockToken);

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
    useAuthStore.getState().setToken(mockToken);

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
    useAuthStore.getState().clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('401 응답이 오고 refreshToken이 없으면 store를 clear하고 ApiError를 reject한다', async () => {
    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    useAuthStore.getState().setToken({ ...mockToken, accessToken: 'expired-token' });
    useAuthStore.setState({ refreshToken: null });

    const { http } = await import('../http');

    await expect(http.get('/api/protected')).rejects.toMatchObject({
      statusCode: expect.any(Number),
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('401 응답이 오고 refreshToken이 있으면 토큰을 갱신하고 요청을 재시도한다', async () => {
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

    useAuthStore.getState().setToken(mockToken);

    const { http } = await import('../http');
    const response = await http.get('/api/protected');

    expect(response.data).toEqual({ data: 'ok' });
    expect(useAuthStore.getState().accessToken).toBe('new-access-token');
  });

  it('401 응답이지만 allowlist 경로(/api/auth/refresh)면 재시도하지 않고 ApiError를 reject한다', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/refresh`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    const { http } = await import('../http');

    await expect(http.post('/api/auth/refresh', {})).rejects.toBeDefined();
  });

  it('401이 아닌 에러(403)는 ApiError로 변환하여 reject한다', async () => {
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
