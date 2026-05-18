import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseAvatarDetail, type AvatarDetail } from '../model';
import { avatarKeys } from '../queryKeys';
import type { ApiError } from '@shared/lib/errors';

async function fetchAvatarDetail(id: string): Promise<AvatarDetail> {
  const response = await http.get(`/api/avatars/${encodeURIComponent(id)}`);
  const parsed = apiResponseAvatarDetail.parse(response.data);
  return parsed.data;
}

type UseAvatarDetailOptions = { enabled?: boolean };

export function useAvatarDetail(id: string, options: UseAvatarDetailOptions = {}) {
  return useQuery<AvatarDetail, ApiError>({
    queryKey: avatarKeys.detail(id),
    queryFn: () => fetchAvatarDetail(id),
    retry: false,
    staleTime: 30_000,
    enabled: (options.enabled ?? true) && id.length > 0,
  });
}

export function useAvatarDetailSuspense(id: string): AvatarDetail {
  const { data } = useSuspenseQuery({
    queryKey: avatarKeys.detail(id),
    queryFn: () => fetchAvatarDetail(id),
    staleTime: 30_000,
    retry: false,
  });
  return data;
}
