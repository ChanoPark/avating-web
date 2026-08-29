import { refreshAccessToken } from '@shared/api/http';
import { parseApiError } from '@shared/lib/errors';
import { useAuthStore } from '@entities/auth/store';
import { verifySession } from '@entities/auth/api/verifySession';

/**
 * 판정은 서버가 한다 — 로컬 `expiresAt` 은 서버 재기동이나 토큰 회수를 모른다.
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
      // 서버가 방금 인정한 세션이므로 왕복 중 로컬 expiresAt 이 지나도 다시 확인하지 않는다 —
      // 여기서 만료로 처리하면 새로고침할 때마다 로그아웃된다.
      useAuthStore.getState().setStatus('authenticated');
      return;
    }

    await refreshAccessToken();
    // 갱신 결과는 어댑터를 거쳐 스토어에 들어오므로, 여기서 스토어를 다시 읽어 확인한다.
    const refreshed = useAuthStore.getState();
    refreshed.setStatus(refreshed.isAuthenticated() ? 'authenticated' : 'anonymous');
  } catch (error) {
    if (parseApiError(error).statusCode === 401) {
      useAuthStore.getState().clear();
      return;
    }

    // 서버 오류(5xx)나 네트워크 단절은 세션이 끊겼다는 증거가 아니다.
    // 여기서 clear() 를 부르면 서버가 잠깐 죽은 것만으로 모든 사용자가 로그아웃된다.
    const fallback = useAuthStore.getState();
    fallback.setStatus(fallback.isAuthenticated() ? 'authenticated' : 'anonymous');
  }
}
