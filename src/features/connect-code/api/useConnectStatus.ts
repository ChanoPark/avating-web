import { useQuery } from '@tanstack/react-query';
import { apiResponseConnectStatus, onboardingKeys } from '@entities/onboarding';
import type { ConnectStatus } from '@entities/onboarding';
import { http } from '@shared/api/http';

async function fetchConnectStatus(): Promise<ConnectStatus> {
  const response = await http.get('/api/onboarding/connect-status');
  const parsed = apiResponseConnectStatus.parse(response.data);
  return parsed.data;
}

type UseConnectStatusOptions = {
  enabled?: boolean;
};

export function useConnectStatus({ enabled = true }: UseConnectStatusOptions = {}) {
  return useQuery({
    queryKey: onboardingKeys.connectStatus('current'),
    queryFn: fetchConnectStatus,
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'active') return 15_000;
      return false;
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}
