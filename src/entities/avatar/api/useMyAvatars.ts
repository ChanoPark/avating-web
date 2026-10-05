import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import type { ApiError } from '@shared/lib/errors';
import { apiResponseOwnedAvatarPage } from '../model';
import type { OwnedAvatar } from '../model';
import { avatarKeys } from '../queryKeys';

const MY_AVATARS_PAGE_SIZE = 50;

async function fetchMyAvatars(): Promise<OwnedAvatar[]> {
  const response = await http.get('/api/avatars/me', { params: { size: MY_AVATARS_PAGE_SIZE } });
  return apiResponseOwnedAvatarPage.parse(response.data).data.content;
}

export function useMyAvatars(options: { enabled?: boolean } = {}) {
  return useQuery<OwnedAvatar[], ApiError>({
    queryKey: avatarKeys.myAvatars(),
    queryFn: fetchMyAvatars,
    retry: false,
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}
