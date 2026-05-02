import { useSuspenseQuery } from '@tanstack/react-query';
import { apiResponseGeneratedAvatar, onboardingKeys } from '@entities/onboarding';
import type { GeneratedAvatar } from '@entities/onboarding';
import { http } from '@shared/api/http';

async function fetchGeneratedAvatar(): Promise<GeneratedAvatar> {
  const response = await http.get('/api/onboarding/avatar');
  const parsed = apiResponseGeneratedAvatar.parse(response.data);
  return parsed.data;
}

export function useGeneratedAvatar() {
  return useSuspenseQuery({
    queryKey: onboardingKeys.avatar(),
    queryFn: fetchGeneratedAvatar,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}
