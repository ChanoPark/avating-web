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
 * 연결 코드를 **쿼리 캐시가 진실 원천**이 되게 발급한다.
 *
 * POST 를 query 로 쓰는 건 `data-tanstack-axios-zod` 규율과 어긋나지만, 여기서는 의도된 예외다.
 * mutation + `issuedRef` 가드 조합은 StrictMode 이중 마운트에서 두 번째 발급을 막는 사이
 * observer 구독이 끊겨 201 을 받고도 화면이 "발급하는 중" 에 멈췄다(실서버 QA S7, 브라우저 재현).
 * 가드를 지우면 코드가 2회 발급되고 재발급이 이전 코드를 즉시 무효화하므로 그것도 답이 아니다.
 *
 * query 로 두면 React Query 가 같은 키의 중복 요청을 dedupe 하고, 컴포넌트는 구독된 observer 를
 * 통해 캐시에서 렌더하므로 두 문제가 함께 사라진다. 재발급은 `refetch()` 다.
 * `staleTime: Infinity` 라 창 포커스로 재요청이 나가 코드가 무효화되는 일도 없다.
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
