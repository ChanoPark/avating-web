import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { avatarKeys } from '@entities/avatar';
import { matchRequestKeys } from '@entities/match-request';

export type InvitationAction = 'accept' | 'cancel';

type InvitationActionInput = { invitationId: string; action: InvitationAction };

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: avatarKeys.myAvatars() });
    },
    // 실패해도 다시 받는다 — 그 사이 상대가 취소·수락했거나 만료된 요청이면 행이 달라져야 한다.
    onSettled: () => queryClient.invalidateQueries({ queryKey: matchRequestKeys.sessions() }),
    throwOnError: false,
  });
}
