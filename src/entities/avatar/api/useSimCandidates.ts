import { useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseAvatarSimCandidateList } from '../model';
import type { AvatarSimCandidateList } from '../model';
import { avatarKeys } from '../queryKeys';

async function fetchSimCandidates(size: number): Promise<AvatarSimCandidateList> {
  const response = await http.get('/api/avatars/candidates', { params: { size } });
  return apiResponseAvatarSimCandidateList.parse(response.data).data;
}

/** 시뮬레이션 상대 후보 — 서버가 랜덤으로 뽑으므로 캐시가 살아 있는 동안은 같은 목록을 유지한다. */
export function useSimCandidatesSuspense(size: number): AvatarSimCandidateList {
  const { data } = useSuspenseQuery({
    queryKey: avatarKeys.candidates(size),
    queryFn: () => fetchSimCandidates(size),
    staleTime: 30_000,
  });
  return data;
}
