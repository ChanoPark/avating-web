import { useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseRecommendedAvatars, dashboardKeys } from '@entities/dashboard';
import type { RecommendedAvatarsResponse, RecommendedAvatarFilter } from '@entities/dashboard';
import { serializeFilter } from '../lib/filterModel';

async function fetchRecommendedAvatars(
  filter: RecommendedAvatarFilter
): Promise<RecommendedAvatarsResponse> {
  const filterParam = serializeFilter(filter);
  const params = filterParam.length > 0 ? { filter: filterParam } : {};
  const response = await http.get('/api/avatars/recommended', { params });
  const parsed = apiResponseRecommendedAvatars.parse(response.data);
  return parsed.data;
}

export function useRecommendedAvatars(filter: RecommendedAvatarFilter): RecommendedAvatarsResponse {
  const { data } = useSuspenseQuery({
    queryKey: dashboardKeys.recommended(filter),
    queryFn: () => fetchRecommendedAvatars(filter),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  return data;
}
