import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { isApiError } from '@shared/lib/errors';
import type { ApiError } from '@shared/lib/errors';
import { apiResponseAvatarSummary } from '../model';
import type { AvatarSummary } from '../model';
import { avatarKeys } from '../queryKeys';

/**
 * 대표 아바타 조회. 응답은 `AvatarSummaryResponse` 로 요약 조회 API 와 같은 형태다.
 *
 * 대표 아바타가 없으면 `null` 을 돌려준다 — 404 를 오류로 던지면 호출부가
 * "아직 만들지 않았다" 와 "서버가 답을 못 줬다" 를 구분할 수 없다. 이 구분이 무너지면
 * 서버가 잠깐 흔들릴 때마다 온보딩을 마친 회원을 다시 온보딩으로 돌려보내게 된다.
 */
async function fetchPrimaryAvatar(): Promise<AvatarSummary | null> {
  try {
    const response = await http.get('/api/avatars/primary');
    return apiResponseAvatarSummary.parse(response.data).data;
  } catch (err: unknown) {
    if (isApiError(err) && err.statusCode === 404) return null;
    throw err;
  }
}

export function usePrimaryAvatar(options: { enabled?: boolean } = {}) {
  return useQuery<AvatarSummary | null, ApiError>({
    queryKey: avatarKeys.primary(),
    queryFn: fetchPrimaryAvatar,
    retry: false,
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}
