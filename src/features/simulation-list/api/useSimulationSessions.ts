import { useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseInvitationHistoryPage, matchRequestKeys } from '@entities/match-request';
import type { InvitationDirection, InvitationHistoryItem } from '@entities/match-request';
import { toSimulationSessions } from '../lib/sessions';
import type { SimulationSessions } from '../lib/sessions';

const DIRECTIONS = ['SENT', 'RECEIVED'] as const satisfies InvitationDirection[];
const PAGE_SIZE = 50;

async function fetchInvitations(direction: InvitationDirection): Promise<InvitationHistoryItem[]> {
  const response = await http.get('/api/simulations/invitations', {
    params: { direction, size: PAGE_SIZE },
  });
  return apiResponseInvitationHistoryPage.parse(response.data).data.content;
}

async function fetchSimulationSessions(): Promise<SimulationSessions> {
  const pages = await Promise.all(DIRECTIONS.map(fetchInvitations));
  return toSimulationSessions(pages.flat());
}

export function useSimulationSessionsSuspense(): SimulationSessions {
  const { data } = useSuspenseQuery({
    queryKey: matchRequestKeys.sessions(),
    queryFn: fetchSimulationSessions,
  });
  return data;
}
