import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { apiResponseConnectCode, onboardingKeys } from '@entities/onboarding';
import type { ConnectCode } from '@entities/onboarding';
import { http } from '@shared/api/http';
import type { ApiError } from '@shared/lib/errors';

async function issueConnectCode(): Promise<ConnectCode> {
  const response = await http.post('/api/persona/connect/code', {});
  const parsed = apiResponseConnectCode.parse(response.data);
  return parsed.data;
}

type UseConnectCodeOptions = {
  enabled?: boolean;
};

/**
 * POST 를 query 로 쓰는 의도된 예외다. mutation + ref 가드 조합을 쓰면 StrictMode 이중 마운트에서
 * 발급 중 화면이 멈춘다. query dedupe 가 그 문제를 없앤다. 재발급은 `refetch()`.
 */
export function useConnectCode({ enabled = true }: UseConnectCodeOptions = {}): UseQueryResult<
  ConnectCode,
  ApiError
> {
  return useQuery<ConnectCode, ApiError>({
    queryKey: onboardingKeys.connectCode(),
    queryFn: issueConnectCode,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}
