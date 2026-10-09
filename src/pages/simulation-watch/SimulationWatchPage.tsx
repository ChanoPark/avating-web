import { Suspense } from 'react';
import { useParams } from 'react-router';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { SessionListPane, SimulationWatch } from '@features/simulation-watch';
import { matchRequestKeys } from '@entities/match-request';
import { simulationKeys } from '@entities/simulation';
import { cn } from '@shared/lib/cn';
import { isApiError } from '@shared/lib/errors';
import { useFailedQueryReset } from '@shared/lib/useFailedQueryReset';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';

const SKELETON_BUBBLE_WIDTHS = ['w-64', 'w-80', 'w-56'];

/** 실제 화면과 같은 머리글 높이 · 여백을 써야 대화가 도착할 때 레이아웃이 밀리지 않는다. */
function WatchSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex min-h-0 flex-1 animate-pulse flex-col">
      <span className="sr-only">대화를 불러오는 중…</span>
      <div className="border-subtle flex h-16 shrink-0 items-center gap-3 border-b px-6">
        <span className="bg-raised size-10 shrink-0 rounded-full" />
        <span className="bg-raised rounded-chip h-5 w-40" />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-4 px-6 pt-5 pb-3">
        {SKELETON_BUBBLE_WIDTHS.map((width) => (
          <div key={width} className="flex items-start gap-3">
            <span className="bg-raised size-8 shrink-0 rounded-full" />
            <span className={cn('bg-raised h-10.5 max-w-full rounded-[16px]', width)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadErrorPanel() {
  useLoadErrorToast(true, '대화를 불러오지 못했어요');
  return (
    <div className="p-7">
      <div className="border-subtle bg-canvas rounded-card h-15 border" />
    </div>
  );
}

// 403 · 404 는 화면 전체를 바꾸는 접근 불가 · 없는 페이지(S-11-02 · S-11-03)라 라우트 경계가 받게 다시 던진다.
function ErrorFallback({ error }: FallbackProps) {
  if (isApiError(error) && (error.statusCode === 403 || error.statusCode === 404)) throw error;
  return <LoadErrorPanel />;
}

export function SimulationWatchPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const turnsReady = useFailedQueryReset(simulationKeys.turns(sessionId));
  const sessionsReady = useFailedQueryReset(matchRequestKeys.sessions());

  return (
    <div className="flex min-h-0 flex-1">
      {sessionsReady && <SessionListPane selectedId={sessionId} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<WatchSkeleton />}>
            {turnsReady && sessionsReady ? (
              <SimulationWatch sessionId={sessionId} />
            ) : (
              <WatchSkeleton />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
