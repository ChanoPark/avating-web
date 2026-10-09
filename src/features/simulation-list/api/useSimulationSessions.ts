import { useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseInvitationHistoryPage, matchRequestKeys } from '@entities/match-request';
import type { InvitationDirection, InvitationHistoryItem } from '@entities/match-request';
import { findSimulationSession, toSimulationSessions, toWatchSessions } from '../lib/sessions';
import type { SimulationSession, SimulationSessions, WatchSessions } from '../lib/sessions';

const DIRECTIONS = ['SENT', 'RECEIVED'] as const satisfies InvitationDirection[];
const PAGE_SIZE = 50;

async function fetchInvitations(direction: InvitationDirection): Promise<InvitationHistoryItem[]> {
  const response = await http.get('/api/simulations/invitations', {
    params: { direction, size: PAGE_SIZE },
  });
  return apiResponseInvitationHistoryPage.parse(response.data).data.content;
}

async function fetchAllInvitations(): Promise<InvitationHistoryItem[]> {
  const pages = await Promise.all(DIRECTIONS.map(fetchInvitations));
  return pages.flat();
}

const invitationsQuery = {
  queryKey: matchRequestKeys.sessions(),
  queryFn: fetchAllInvitations,
  retry: false,
  staleTime: 30_000,
} as const;

function selectSessions(invitations: InvitationHistoryItem[]): SimulationSessions {
  return toSimulationSessions(invitations);
}

export function useSimulationSessionsSuspense(): SimulationSessions {
  const { data } = useSuspenseQuery({ ...invitationsQuery, select: selectSessions });
  return data;
}

export function useSimulationSessionSuspense(simulationId: string): SimulationSession | undefined {
  const { data } = useSuspenseQuery({
    ...invitationsQuery,
    select: (invitations) => findSimulationSession(invitations, simulationId),
  });
  return data;
}

export function useWatchSessionsSuspense(): WatchSessions {
  const { data } = useSuspenseQuery({ ...invitationsQuery, select: toWatchSessions });
  return data;
}
