import { describe, it, expect, afterEach } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { resetHttpAuth } from '@shared/api/http';
import { verifySession } from '../verifySession';

const BASE_URL = 'http://localhost:8080';

describe('verifySession — 서버에 세션 유효성을 묻는다', () => {
  afterEach(() => {
    resetHttpAuth();
  });

  it('200 이면 서버가 인정한 세션 주인을 돌려준다', async () => {
    server.use(
      mswHttp.get(`${BASE_URL}/api/auth/me`, () =>
        HttpResponse.json({ data: { email: 'coach@avating.app', nickname: '코치' } })
      )
    );

    await expect(verifySession()).resolves.toEqual({
      email: 'coach@avating.app',
      nickname: '코치',
    });
  });

  it('401 이면 statusCode 401 로 거절한다', async () => {
    server.use(
      mswHttp.get(`${BASE_URL}/api/auth/me`, () =>
        HttpResponse.json({ code: 'AUTH_401_001', message: '만료된 토큰' }, { status: 401 })
      )
    );

    await expect(verifySession()).rejects.toMatchObject({ statusCode: 401 });
  });

  it('응답 형태가 계약과 다르면 파싱 단계에서 거절한다', async () => {
    server.use(mswHttp.get(`${BASE_URL}/api/auth/me`, () => HttpResponse.json({ data: {} })));

    await expect(verifySession()).rejects.toThrow();
  });
});
