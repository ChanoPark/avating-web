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
  /** 수락 직후에는 avating-ai 에 세션이 등록되기 전이라 1~2초간 404 가 온다(simulation-stream-guide § 7). */
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
  });
  return data;
}
