import { useSuspenseQuery } from '@tanstack/react-query';
import { aiGetJson } from '@shared/api/aiFetch';
import { isApiError } from '@shared/lib/errors';
import { sessionTurnsSchema, type SessionTurns } from '../model';
import { simulationKeys } from '../queryKeys';

const REGISTRATION_RETRY_LIMIT = 30;
const REGISTRATION_RETRY_DELAY_MS = 1_000;

async function fetchSessionTurns(sessionId: string, signal: AbortSignal): Promise<SessionTurns> {
  const body = await aiGetJson(`/v1/sessions/${encodeURIComponent(sessionId)}/turns`, signal);
  return sessionTurnsSchema.parse(body);
}

type SessionTurnsOptions = {
  awaitRegistration: boolean;
};

export function useSessionTurnsSuspense(
  sessionId: string,
  { awaitRegistration }: SessionTurnsOptions
): SessionTurns {
  const { data } = useSuspenseQuery({
    queryKey: simulationKeys.turns(sessionId),
    queryFn: ({ signal }) => fetchSessionTurns(sessionId, signal),
    retry: (failureCount, error) =>
      awaitRegistration &&
      isApiError(error) &&
      error.statusCode === 404 &&
      failureCount < REGISTRATION_RETRY_LIMIT,
    retryDelay: REGISTRATION_RETRY_DELAY_MS,
    staleTime: 0,
  });
  return data;
}
