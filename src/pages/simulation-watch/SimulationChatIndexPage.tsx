import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Navigate, useNavigate } from 'react-router';
import { MessagesSquare } from 'lucide-react';
import { useSessionPaneStore, WatchSkeleton } from '@features/simulation-watch';
import { SESSION_CARD_CLASS, useWatchSessionsSuspense } from '@features/simulation-list';
import { matchRequestKeys } from '@entities/match-request';
import { EmptyState } from '@shared/ui/EmptyState';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';
import { cn } from '@shared/lib/cn';
import { useFailedQueryReset } from '@shared/lib/useFailedQueryReset';

function PaddedPage({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto p-7">{children}</div>;
}

function ChatTarget() {
  const navigate = useNavigate();
  const { running, ended } = useWatchSessionsSuspense();
  const lastSessionId = useSessionPaneStore((s) => s.lastSessionId);

  const openable = [...running, ...ended].flatMap((session) =>
    session.simulationId === undefined ? [] : [session.simulationId]
  );
  const target =
    lastSessionId !== null && openable.includes(lastSessionId) ? lastSessionId : openable[0];

  if (target !== undefined) return <Navigate to={`/sim/${encodeURIComponent(target)}`} replace />;

  return (
    <PaddedPage>
      <div className={SESSION_CARD_CLASS}>
        <EmptyState
          icon={MessagesSquare}
          title="아직 볼 수 있는 대화가 없어요"
          description="매칭이 수락되면 여기서 관전할 수 있어요"
          action={{
            label: '추천 아바타 보기',
            onClick: () => {
              void navigate('/explore');
            },
          }}
        />
      </div>
    </PaddedPage>
  );
}

function LoadErrorPanel() {
  useLoadErrorToast(true, '시뮬레이션 목록을 불러오지 못했어요');
  return (
    <PaddedPage>
      <div className={cn(SESSION_CARD_CLASS, 'h-15')} />
    </PaddedPage>
  );
}

export function SimulationChatIndexPage() {
  const ready = useFailedQueryReset(matchRequestKeys.sessions());

  return (
    <ErrorBoundary fallbackRender={() => <LoadErrorPanel />}>
      <Suspense fallback={<WatchSkeleton />}>{ready ? <ChatTarget /> : <WatchSkeleton />}</Suspense>
    </ErrorBoundary>
  );
}
