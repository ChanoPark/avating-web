import { Suspense } from 'react';
import { useParams } from 'react-router';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { SessionListPane, SimulationWatch, WatchSkeleton } from '@features/simulation-watch';
import { SESSION_CARD_CLASS } from '@features/simulation-list';
import { matchRequestKeys } from '@entities/match-request';
import { simulationKeys } from '@entities/simulation';
import { cn } from '@shared/lib/cn';
import { isApiError } from '@shared/lib/errors';
import { useFailedQueryReset } from '@shared/lib/useFailedQueryReset';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';

function LoadErrorPanel() {
  useLoadErrorToast(true, '대화를 불러오지 못했어요');
  return (
    <div className="p-7">
      <div className={cn(SESSION_CARD_CLASS, 'h-15')} />
    </div>
  );
}

const ROUTE_LEVEL_STATUSES = [401, 403, 404];

function ErrorFallback({ error }: FallbackProps) {
  if (isApiError(error) && ROUTE_LEVEL_STATUSES.includes(error.statusCode)) throw error;
  return <LoadErrorPanel />;
}

function WatchedSessionRoute({ sessionId }: { sessionId: string }) {
  const ready = useFailedQueryReset(simulationKeys.turns(sessionId));

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<WatchSkeleton />}>
        {ready ? <SimulationWatch sessionId={sessionId} /> : <WatchSkeleton />}
      </Suspense>
    </ErrorBoundary>
  );
}

export function SimulationWatchPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const sessionsReady = useFailedQueryReset(matchRequestKeys.sessions());

  return (
    <div className="flex min-h-0 flex-1">
      {sessionsReady && <SessionListPane selectedId={sessionId} />}
      <div className="flex min-w-0 flex-1 flex-col">
        {sessionsReady ? (
          <WatchedSessionRoute key={sessionId} sessionId={sessionId} />
        ) : (
          <WatchSkeleton />
        )}
      </div>
    </div>
  );
}
