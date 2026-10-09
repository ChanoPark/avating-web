import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { avatarKeys } from '@entities/avatar';
import { matchRequestKeys } from '@entities/match-request';

export type InvitationAction = 'accept' | 'cancel';

type InvitationActionInput = {
  invitationId: string;
  partnerAvatarId: string;
  action: InvitationAction;
};

async function runInvitationAction({ invitationId, action }: InvitationActionInput): Promise<void> {
  if (action === 'accept') {
    await http.post(`/api/simulations/invitations/${invitationId}/accept`);
    return;
  }
  await http.patch(`/api/simulations/invitations/${invitationId}/cancel`);
}

export function useInvitationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runInvitationAction,
    onSuccess: (_data, { action, partnerAvatarId }) => {
      void queryClient.invalidateQueries({ queryKey: avatarKeys.myAvatars() });
      if (action === 'cancel') {
        void queryClient.invalidateQueries({ queryKey: avatarKeys.detail(partnerAvatarId) });
        void queryClient.invalidateQueries({ queryKey: avatarKeys.candidatesAll() });
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: matchRequestKeys.sessions() }),
    throwOnError: false,
  });
}
