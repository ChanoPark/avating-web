import { refreshAccessToken } from '@shared/api/http';
import { parseApiError } from '@shared/lib/errors';
import { useAuthStore } from '@entities/auth/store';
import { verifySession } from '@entities/auth/api/verifySession';

/**
 * 부팅 시 한 번 돌며 `status: 'restoring'` 을 authenticated / anonymous 로 확정한다.
 *
 * **판정은 서버가 한다.** 저장된 `expiresAt` 은 발급 시각 + `expiresIn` 으로 우리가 계산한
 * 값이라, 서버가 재기동해 세션을 잃었거나 토큰이 회수된 것을 알 수 없다. 로컬 시각만 믿으면
 * 죽은 세션으로 대시보드가 그려지고, 첫 API 호출이 401 을 받고 나서야 로그인으로 튕긴다.
 *
 * 저장 상태에 따라 왕복 한 번씩:
 * - refreshToken 없음 → 되살릴 길이 없다. 네트워크 없이 anonymous.
 * - accessToken 이 로컬 기준 유효 → `GET /api/auth/me` 로 서버에 확인한다.
 *   401 이면 `http` 인터셉터가 refresh 후 한 번 재시도하므로 여기서 따로 부르지 않는다.
 * - accessToken 만료 → refresh 가 곧 세션 검증이다. `/me` 를 먼저 부르면 어차피 401 →
 *   refresh → 재시도로 왕복이 세 번이 된다.
 *
 * refresh 는 `refreshAccessToken()` 단일 통로를 거치므로 401 인터셉터와 in-flight 를 공유한다.
 * 호출 전에 `configureHttp()` 가 실행돼 있어야 갱신 결과가 스토어에 반영된다.
 */
export async function bootstrapAuth(): Promise<void> {
  const state = useAuthStore.getState();

  if (state.refreshToken === null) {
    state.setStatus('anonymous');
    return;
  }

  try {
    if (state.isAuthenticated()) {
      await verifySession();
      // 서버가 방금 인정한 세션이다. 왕복 사이에 로컬 `expiresAt` 이 지났더라도 여기서
      // 만료를 다시 따지지 않는다 — 새로고침이 곧 로그아웃이 되는 그 경로다(실서버 QA S1).
      // 곧 만료될 토큰은 401 인터셉터가 갱신으로 처리한다.
      useAuthStore.getState().setStatus('authenticated');
      return;
    }

    await refreshAccessToken();
    // 갱신 결과는 어댑터(onTokenRefreshed)를 거쳐 스토어에 들어온다.
    // 어댑터가 연결돼 있지 않으면 토큰 없이 restoring 에 갇히므로 여기서 확인한다.
    const refreshed = useAuthStore.getState();
    refreshed.setStatus(refreshed.isAuthenticated() ? 'authenticated' : 'anonymous');
  } catch (error) {
    if (parseApiError(error).statusCode === 401) {
      // 서버가 세션을 부정했고 refresh 도 거절됐다 — 되살릴 수 없다.
      useAuthStore.getState().clear();
      return;
    }

    // 서버가 고장났거나(5xx) 닿지 않는다(오프라인·서버 다운). 세션이 끊긴 증거가 아니므로
    // **토큰을 지우지 않는다** — 여기서 clear() 하면 서버 장애가 전원 로그아웃이 된다.
    const fallback = useAuthStore.getState();
    fallback.setStatus(fallback.isAuthenticated() ? 'authenticated' : 'anonymous');
  }
}
