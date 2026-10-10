import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Navigate, useNavigate } from 'react-router';
import { MessagesSquare } from 'lucide-react';
import { useSessionPaneStore } from '@features/simulation-watch';
import { useWatchSessionsSuspense } from '@features/simulation-list';
import { matchRequestKeys } from '@entities/match-request';
import { EmptyState } from '@shared/ui/EmptyState';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';
import { useFailedQueryReset } from '@shared/lib/useFailedQueryReset';

const CARD_CLASS = 'border-subtle bg-canvas rounded-card overflow-hidden border';

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
    <div className={CARD_CLASS}>
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
  );
}

function LoadErrorPanel() {
  useLoadErrorToast(true, '시뮬레이션 목록을 불러오지 못했어요');
  return <div className={`${CARD_CLASS} h-15`} />;
}

export function SimulationChatIndexPage() {
  const ready = useFailedQueryReset(matchRequestKeys.sessions());

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-7">
      <ErrorBoundary fallbackRender={() => <LoadErrorPanel />}>
        <Suspense fallback={null}>{ready && <ChatTarget />}</Suspense>
      </ErrorBoundary>
    </div>
  );
}
