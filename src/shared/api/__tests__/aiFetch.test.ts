import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { isApiError } from '@shared/lib/errors';
import { configureHttpAuth, resetHttpAuth } from '../http';
import { aiGetJson } from '../aiFetch';

const CORE_URL = import.meta.env.VITE_API_BASE_URL as string;
const AI_URL = import.meta.env.VITE_AI_API_BASE_URL as string;
const TURNS_URL = `${AI_URL}/v1/sessions/sim-1/turns`;
const TURNS_PATH = '/v1/sessions/sim-1/turns';

function installAuth(initial: { accessToken: string | null; refreshToken: string | null }) {
  const state = { ...initial };
  const onUnauthorized = vi.fn();
  configureHttpAuth({
    getAccessToken: () => state.accessToken,
    getRefreshToken: () => state.refreshToken,
    onTokenRefreshed: (payload) => {
      state.accessToken = payload.accessToken;
      state.refreshToken = payload.refreshToken;
    },
    onUnauthorized,
  });
  return { state, onUnauthorized };
}

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('거부될 것으로 기대했지만 성공했다');
}

describe('aiGetJson', () => {
  beforeEach(() => {
    resetHttpAuth();
  });

  afterEach(() => {
    resetHttpAuth();
  });

  it('avating-ai base URL 로 보내고 봉투 없는 본문을 그대로 돌려준다', async () => {
    installAuth({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const body = { sessionId: 'sim-1', turns: [], completed: true };
    server.use(mswHttp.get(TURNS_URL, () => HttpResponse.json(body)));

    await expect(aiGetJson(TURNS_PATH)).resolves.toEqual(body);
  });

  it('accessToken 이 있으면 Authorization: Bearer 로 싣는다', async () => {
    installAuth({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    let authorization: string | null = null;
    server.use(
      mswHttp.get(TURNS_URL, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({});
      })
    );

    await aiGetJson(TURNS_PATH);
    expect(authorization).toBe('Bearer access-1');
  });

  it('accessToken 이 없으면 Authorization 헤더를 싣지 않는다', async () => {
    installAuth({ accessToken: null, refreshToken: null });
    let authorization: string | null = 'unset';
    server.use(
      mswHttp.get(TURNS_URL, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({});
      })
    );

    await aiGetJson(TURNS_PATH);
    expect(authorization).toBeNull();
  });

  it('실패 응답은 상태 코드와 본문의 code 를 담은 ApiError 로 던진다', async () => {
    installAuth({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    server.use(
      mswHttp.get(TURNS_URL, () =>
        HttpResponse.json({ code: 'SESSION_ACCESS_DENIED' }, { status: 403 })
      )
    );

    const error = await catchError(aiGetJson(TURNS_PATH));
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ statusCode: 403, code: 'SESSION_ACCESS_DENIED' });
  });

  it('실패 응답 본문이 JSON 이 아니어도 상태 코드로 ApiError 를 던진다', async () => {
    installAuth({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    server.use(mswHttp.get(TURNS_URL, () => new HttpResponse('Bad Gateway', { status: 502 })));

    const error = await catchError(aiGetJson(TURNS_PATH));
    expect(error).toMatchObject({ statusCode: 502, code: undefined });
  });

  it('401 이면 토큰을 한 번 갱신하고 새 토큰으로 다시 보낸다', async () => {
    const { state, onUnauthorized } = installAuth({
      accessToken: 'expired',
      refreshToken: 'refresh-1',
    });
    const seen: (string | null)[] = [];
    server.use(
      mswHttp.post(`${CORE_URL}/api/auth/refresh`, () =>
        HttpResponse.json({
          data: {
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
            tokenType: 'Bearer',
            expiresIn: 3600,
          },
        })
      ),
      mswHttp.get(TURNS_URL, ({ request }) => {
        const authorization = request.headers.get('Authorization');
        seen.push(authorization);
        return authorization === 'Bearer access-2'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
      })
    );

    await expect(aiGetJson(TURNS_PATH)).resolves.toEqual({ ok: true });
    expect(seen).toEqual(['Bearer expired', 'Bearer access-2']);
    expect(state.accessToken).toBe('access-2');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('갱신에 실패하면 onUnauthorized 를 부르고 401 ApiError 를 던진다', async () => {
    const { onUnauthorized } = installAuth({ accessToken: 'expired', refreshToken: 'refresh-1' });
    server.use(
      mswHttp.post(`${CORE_URL}/api/auth/refresh`, () =>
        HttpResponse.json({ code: 'AUTH_401_006', message: '만료' }, { status: 401 })
      ),
      mswHttp.get(TURNS_URL, () => HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }))
    );

    const error = await catchError(aiGetJson(TURNS_PATH));
    expect(error).toMatchObject({ statusCode: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('갱신한 토큰으로도 401 이면 다시 갱신하지 않고 401 ApiError 를 던진다', async () => {
    installAuth({ accessToken: 'expired', refreshToken: 'refresh-1' });
    let refreshCalls = 0;
    server.use(
      mswHttp.post(`${CORE_URL}/api/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({
          data: {
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
            tokenType: 'Bearer',
            expiresIn: 3600,
          },
        });
      }),
      mswHttp.get(TURNS_URL, () => HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }))
    );

    const error = await catchError(aiGetJson(TURNS_PATH));
    expect(error).toMatchObject({ statusCode: 401 });
    expect(refreshCalls).toBe(1);
  });

  it('응답 자체가 없는 네트워크 오류는 statusCode 0 인 ApiError 다', async () => {
    installAuth({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    server.use(mswHttp.get(TURNS_URL, () => HttpResponse.error()));

    const error = await catchError(aiGetJson(TURNS_PATH));
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ statusCode: 0 });
  });
});
