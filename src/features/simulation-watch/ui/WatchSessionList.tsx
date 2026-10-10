import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { EmptyState } from '@shared/ui/EmptyState';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';
import { cn } from '@shared/lib/cn';
import { useFailedQueryReset } from '@shared/lib/useFailedQueryReset';
import { useMyAvatars } from '@entities/avatar';
import { matchRequestKeys } from '@entities/match-request';
import {
  SESSION_CARD_CLASS,
  SessionRow,
  SessionTable,
  SessionTableSkeleton,
  isRunning,
  useWatchSessionsSuspense,
} from '@features/simulation-list';

const LOADING_LABEL = '시뮬레이션 목록을 불러오는 중…';

function WatchSessionListContent() {
  const navigate = useNavigate();
  const { running, ended } = useWatchSessionsSuspense();
  const { data: myAvatars = [] } = useMyAvatars();
  const colorByAvatarId = new Map(myAvatars.map((avatar) => [avatar.avatarId, avatar.color]));

  if (running.length === 0 && ended.length === 0) {
    return (
      <div className={SESSION_CARD_CLASS}>
        <EmptyState
          icon={MessagesSquare}
          title="아직 시작한 시뮬레이션이 없어요"
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

  const sections = [
    { title: '진행 중인 시뮬레이션', sessions: running },
    { title: '끝난 시뮬레이션', sessions: ended },
  ].filter((section) => section.sessions.length > 0);

  return (
    <>
      {sections.map(({ title, sessions }) => (
        <SessionTable key={title} title={title} actionWidth="wide" showDirection={false}>
          {sessions.map((session) => {
            const { simulationId } = session;
            const actionLabel = isRunning(session.status) ? '관전하기' : '결과 보기';
            return (
              <SessionRow
                key={session.id}
                session={session}
                myColor={colorByAvatarId.get(session.mine.avatarId)}
              >
                <Button
                  variant="secondary"
                  size="xs"
                  aria-label={`${session.partner.name} 시뮬레이션 ${actionLabel}`}
                  disabled={simulationId === undefined}
                  onClick={() => {
                    if (simulationId !== undefined) {
                      void navigate(`/sim/${encodeURIComponent(simulationId)}`);
                    }
                  }}
                >
                  {actionLabel}
                </Button>
              </SessionRow>
            );
          })}
        </SessionTable>
      ))}
    </>
  );
}

function WatchSessionListFallback() {
  useLoadErrorToast(true, '시뮬레이션 목록을 불러오지 못했어요');
  return <div className={cn(SESSION_CARD_CLASS, 'h-15')} />;
}

export function WatchSessionList() {
  const ready = useFailedQueryReset(matchRequestKeys.sessions());
  const skeleton = (
    <SessionTableSkeleton label={LOADING_LABEL} actionWidth="wide" showDirection={false} />
  );

  return (
    <ErrorBoundary fallbackRender={() => <WatchSessionListFallback />}>
      <Suspense fallback={skeleton}>{ready ? <WatchSessionListContent /> : skeleton}</Suspense>
    </ErrorBoundary>
  );
}
