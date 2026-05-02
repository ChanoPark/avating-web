import { useMutation } from '@tanstack/react-query';
import { apiResponseCompleteOnboarding } from '@entities/onboarding';
import { http } from '@shared/api/http';

async function completeOnboarding(): Promise<{ completedAt: string }> {
  const response = await http.post('/api/onboarding/complete', {});
  const parsed = apiResponseCompleteOnboarding.parse(response.data);
  return parsed.data;
}

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: completeOnboarding,
    throwOnError: false,
  });
}
