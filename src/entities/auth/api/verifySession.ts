import { http } from '@shared/api/http';
import { apiResponseSession, type SessionResponse } from '../model';

/**
 * 서버에도 세션이 아직 유효한지 확인한다 — 로컬 `expiresAt` 은 계산값이라 서버 재기동·토큰 회수를 모른다.
 * `http` 인스턴스를 쓰므로 401 이면 인터셉터가 refresh 후 재시도한다. 여기까지 401 이면 refresh 도 거절된 세션이다.
 */
export async function verifySession(): Promise<SessionResponse> {
  const response = await http.get('/api/auth/me');
  return apiResponseSession.parse(response.data).data;
}
