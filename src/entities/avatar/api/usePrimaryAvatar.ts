import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { isApiError } from '@shared/lib/errors';
import type { ApiError } from '@shared/lib/errors';
import { apiResponseAvatarSummary } from '../model';
import type { AvatarSummary } from '../model';
import { avatarKeys } from '../queryKeys';

/** 대표 아바타 조회 — 없으면 404 대신 null 을 반환한다. 404 를 오류로 던지면 "없음"과 "서버 오류"를 구분 못 해, 서버가 잠깐 흔들릴 때마다 온보딩 완료 회원이 다시 온보딩으로 밀린다. */
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
