import { env } from '@shared/config/env';
import { ApiError, parseApiError } from '@shared/lib/errors';
import { getAccessToken, notifyUnauthorized, refreshAccessToken } from './http';

type AiFetchOptions = {
  accept: string;
  signal?: AbortSignal | undefined;
};

function send(path: string, token: string | null, { accept, signal }: AiFetchOptions) {
  return fetch(`${env.VITE_AI_API_BASE_URL}${path}`, {
    headers: {
      Accept: accept,
      ...(token !== null && { Authorization: `Bearer ${token}` }),
    },
    ...(signal !== undefined && { signal }),
  });
}

/** 401 이면 토큰을 한 번 갱신해 다시 보낸다. 상태 코드 해석은 부르는 쪽 몫이라 Response 를 그대로 돌려준다. */
export async function aiFetch(path: string, options: AiFetchOptions): Promise<Response> {
  const response = await send(path, getAccessToken(), options);
  if (response.status !== 401) return response;

  let refreshedToken: string;
  try {
    refreshedToken = await refreshAccessToken();
  } catch {
    notifyUnauthorized();
    return response;
  }
  return send(path, refreshedToken, options);
}

async function readErrorCode(response: Response): Promise<string | undefined> {
  const body: unknown = await response.json().catch(() => null);
  if (body === null || typeof body !== 'object') return undefined;
  const { code } = body as { code?: unknown };
  return typeof code === 'string' ? code : undefined;
}

// avating-ai 는 core 와 달리 성공 응답에 { data } 봉투가 없고 에러 본문은 { code } 뿐이다.
export async function aiGetJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await aiFetch(path, { accept: 'application/json', signal }).catch(
    (error: unknown) => {
      throw parseApiError(error);
    }
  );
  if (!response.ok) {
    throw new ApiError(
      response.status,
      `avating-ai ${path} 요청 실패 (${String(response.status)})`,
      await readErrorCode(response)
    );
  }
  return response.json();
}
