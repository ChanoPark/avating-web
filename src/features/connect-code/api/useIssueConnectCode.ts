import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiResponseConnectCode, onboardingKeys } from '@entities/onboarding';
import type { ConnectCode } from '@entities/onboarding';
import { http } from '@shared/api/http';

async function issueConnectCode(): Promise<ConnectCode> {
  const response = await http.post('/api/persona/connect/code', {});
  const parsed = apiResponseConnectCode.parse(response.data);
  return parsed.data;
}

export function useIssueConnectCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueConnectCode,
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.connectCode(), data);
    },
    throwOnError: false,
  });
}
