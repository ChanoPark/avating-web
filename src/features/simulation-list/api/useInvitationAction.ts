import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { avatarKeys } from '@entities/avatar';
import {
  DEFAULT_REJECT_MESSAGE,
  matchRequestKeys,
  rejectInvitationRequestSchema,
} from '@entities/match-request';

export type InvitationAction = 'accept' | 'cancel' | 'reject';

type InvitationTarget = {
  invitationId: string;
  partnerAvatarId: string;
};

export type InvitationActionInput =
  | (InvitationTarget & { action: 'accept' | 'cancel' })
  | (InvitationTarget & { action: 'reject'; rejectMessage: string });

async function runInvitationAction(input: InvitationActionInput): Promise<void> {
  const path = `/api/simulations/invitations/${input.invitationId}`;
  switch (input.action) {
    case 'accept':
      await http.post(`${path}/accept`);
      return;
    case 'cancel':
      await http.patch(`${path}/cancel`);
      return;
    case 'reject': {
      const rejectMessage = input.rejectMessage.trim() || DEFAULT_REJECT_MESSAGE;
      await http.patch(`${path}/reject`, rejectInvitationRequestSchema.parse({ rejectMessage }));
      return;
    }
  }
}

export function useInvitationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runInvitationAction,
    onSuccess: (_data, { action, partnerAvatarId }) => {
      void queryClient.invalidateQueries({ queryKey: avatarKeys.myAvatars() });
      if (action !== 'accept') {
        void queryClient.invalidateQueries({ queryKey: avatarKeys.detail(partnerAvatarId) });
        void queryClient.invalidateQueries({ queryKey: avatarKeys.candidatesAll() });
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: matchRequestKeys.all }),
    throwOnError: false,
  });
}
