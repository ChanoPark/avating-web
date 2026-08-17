import { http } from '@shared/api/http';
import { apiResponseSession, type SessionResponse } from '../model';

/**
 * 저장된 세션이 **서버에서도** 아직 유효한지 묻는다.
 *
 * localStorage 의 `expiresAt` 은 발급 시각으로 우리가 계산한 값이라, 서버가 재기동해
 * 세션을 잃었거나 토큰이 회수된 것을 알지 못한다. 그 판정을 서버에 넘기는 것이 이 호출이다.
 *
 * `http` 인스턴스를 쓰므로 401 이면 응답 인터셉터가 refresh 후 한 번 재시도한다.
 * 여기까지 401 로 돌아오면 refresh 도 거절된 것 — 되살릴 수 없는 세션이다.
 */
export async function verifySession(): Promise<SessionResponse> {
  const response = await http.get('/api/auth/me');
  return apiResponseSession.parse(response.data).data;
}
