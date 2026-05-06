import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import {
  apiResponseMatchRequest,
  matchRequestKeys,
  sendMatchRequestSchema,
} from '@entities/match-request';
import type { MatchRequest, SendMatchRequestInput } from '@entities/match-request';
import type { ApiError } from '@shared/lib/errors';

async function sendMatchRequest(input: SendMatchRequestInput): Promise<MatchRequest> {
  // defense-in-depth: form resolver 가 이미 파싱했더라도 API 경계에서 한번 더 narrow.
  const validated = sendMatchRequestSchema.parse(input);
  const response = await http.post('/api/match-requests', validated);
  const parsed = apiResponseMatchRequest.parse(response.data);
  return parsed.data;
}

export function useSendMatchRequest() {
  const queryClient = useQueryClient();

  return useMutation<MatchRequest, ApiError, SendMatchRequestInput>({
    mutationFn: sendMatchRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchRequestKeys.sent() });
      void queryClient.invalidateQueries({ queryKey: matchRequestKeys.myAvatars() });
    },
    throwOnError: false,
  });
}
