import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseMyAvatars, matchRequestKeys } from '@entities/match-request';
import type { MyAvatarsResponse } from '@entities/match-request';
import type { ApiError } from '@shared/lib/errors';

async function fetchMyAvatars(): Promise<MyAvatarsResponse> {
  const response = await http.get('/api/me/avatars');
  const parsed = apiResponseMyAvatars.parse(response.data);
  return parsed.data;
}

export function useMyAvatars() {
  return useQuery<MyAvatarsResponse, ApiError>({
    queryKey: matchRequestKeys.myAvatars(),
    queryFn: fetchMyAvatars,
    retry: false,
  });
}
