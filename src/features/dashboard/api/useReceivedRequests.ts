import { useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import {
  apiResponseInvitationHistoryPage,
  INVITATION_PAGE_SIZE_MAX,
  matchRequestKeys,
} from '@entities/match-request';
import type { InvitationHistoryItem } from '@entities/match-request';

export const RECEIVED_REQUESTS_VISIBLE_LIMIT = 3;

type ReceivedRequest = {
  id: string;
  inviterName: string;
  myAvatarName: string;
  requestMessage?: string;
  requestedAt: string;
};

type ReceivedRequests = {
  items: ReceivedRequest[];
  pendingCount: number;
};

async function fetchReceivedPending(): Promise<InvitationHistoryItem[]> {
  const response = await http.get('/api/simulations/invitations', {
    params: { direction: 'RECEIVED', status: 'PENDING', size: INVITATION_PAGE_SIZE_MAX },
  });
  return apiResponseInvitationHistoryPage.parse(response.data).data.content;
}

function toReceivedRequest(invitation: InvitationHistoryItem): ReceivedRequest {
  return {
    id: invitation.simulationInvitationId,
    inviterName: invitation.inviterAvatarName,
    myAvatarName: invitation.inviteeAvatarName,
    ...(invitation.requestMessage !== undefined && { requestMessage: invitation.requestMessage }),
    requestedAt: invitation.createdAt,
  };
}

function toReceivedRequests(
  invitations: InvitationHistoryItem[],
  now: number = Date.now()
): ReceivedRequests {
  const pending = invitations
    .filter((invitation) => Date.parse(invitation.expiredAt) > now)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return {
    items: pending.slice(0, RECEIVED_REQUESTS_VISIBLE_LIMIT).map(toReceivedRequest),
    pendingCount: pending.length,
  };
}

function selectReceivedRequests(invitations: InvitationHistoryItem[]): ReceivedRequests {
  return toReceivedRequests(invitations);
}

export function useReceivedRequestsSuspense(): ReceivedRequests {
  const { data } = useSuspenseQuery({
    queryKey: matchRequestKeys.receivedPending(),
    queryFn: fetchReceivedPending,
    select: selectReceivedRequests,
    retry: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  return data;
}
