import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import {
  apiResponseCreateInvitation,
  matchRequestKeys,
  sendMatchRequestSchema,
} from '@entities/match-request';
import type { CreatedInvitation, SendMatchRequestInput } from '@entities/match-request';
import { avatarKeys } from '@entities/avatar';
import type { AvatarSimCandidateList } from '@entities/avatar';
import type { ApiError } from '@shared/lib/errors';

async function sendMatchRequest(input: SendMatchRequestInput): Promise<CreatedInvitation> {
  const { partnerAvatarId, requesterAvatarId, greeting } = sendMatchRequestSchema.parse(input);
  const response = await http.post('/api/simulations/invitations', {
    inviterAvatarId: requesterAvatarId,
    inviteeAvatarId: partnerAvatarId,
    ...(greeting === undefined ? {} : { requestMessage: greeting }),
  });
  return apiResponseCreateInvitation.parse(response.data).data;
}

export function useSendMatchRequest() {
  const queryClient = useQueryClient();

  return useMutation<CreatedInvitation, ApiError, SendMatchRequestInput>({
    mutationFn: sendMatchRequest,
    onSuccess: (_request, { partnerAvatarId }) => {
      void queryClient.invalidateQueries({ queryKey: matchRequestKeys.sent() });
      void queryClient.invalidateQueries({ queryKey: avatarKeys.myAvatars() });
      // 후보 목록은 랜덤 조회라 무효화해 다시 받으면 카드가 섞인다.
      queryClient.setQueriesData<AvatarSimCandidateList>(
        { queryKey: avatarKeys.candidatesAll() },
        (list) =>
          list && {
            ...list,
            items: list.items.map((candidate) =>
              candidate.avatarId === partnerAvatarId
                ? { ...candidate, canRequestSimulation: false }
                : candidate
            ),
          }
      );
    },
    throwOnError: false,
  });
}
