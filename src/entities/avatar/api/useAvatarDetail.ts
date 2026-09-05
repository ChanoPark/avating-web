import { useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseAvatarDetail, type AvatarDetail } from '../model';
import { avatarKeys } from '../queryKeys';

async function fetchAvatarDetail(id: string): Promise<AvatarDetail> {
  const response = await http.get(`/api/avatars/${encodeURIComponent(id)}`);
  const parsed = apiResponseAvatarDetail.parse(response.data);
  return parsed.data;
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
