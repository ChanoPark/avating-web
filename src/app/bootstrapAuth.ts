import { refreshAccessToken } from '@shared/api/http';
import { useAuthStore } from '@entities/auth/store';

/**
 * 부팅 시 한 번 돌며 `status: 'restoring'` 을 authenticated / anonymous 로 확정한다.
 *
 * 세 경로 중 두 개는 동기라 첫 렌더 전에 끝난다 —
 * (1) 유효한 accessToken 이 남아 있으면 그대로 인증, (2) refreshToken 이 없으면 익명.
 * (3) accessToken 만 만료된 경우에만 refresh 왕복이 필요해 `restoring` 이 잠시 유지되고,
 * 그동안 `AuthGuard` 가 대기 화면을 보여준다.
 *
 * refresh 는 `refreshAccessToken()` 을 거치므로 401 인터셉터와 in-flight 를 공유한다.
 * 호출 전에 `configureHttp()` 가 실행돼 있어야 갱신 결과가 스토어에 반영된다.
 */
export async function bootstrapAuth(): Promise<void> {
  const state = useAuthStore.getState();

  if (state.isAuthenticated()) {
    state.setStatus('authenticated');
    return;
  }

  if (state.refreshToken === null) {
    state.setStatus('anonymous');
    return;
  }

  try {
    await refreshAccessToken();
    // 갱신 결과는 어댑터(onTokenRefreshed)를 거쳐 스토어에 들어온다.
    // 어댑터가 연결돼 있지 않으면 토큰 없이 restoring 에 갇히므로 여기서 확인한다.
    if (!useAuthStore.getState().isAuthenticated()) {
      useAuthStore.getState().clear();
    }
  } catch {
    // refreshToken 만료·회수(AUTH_401_006) — 조용히 익명으로 떨어뜨린다.
    useAuthStore.getState().clear();
  }
}
