import { Suspense, useCallback, useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { EmptyState } from '@shared/ui/EmptyState';
import { useToast } from '@shared/ui/Toast/useToast';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';
import { SERVER_ERROR_CODES } from '@shared/api/errorCodes';
import { cn } from '@shared/lib/cn';
import { isApiError } from '@shared/lib/errors';
import { useFailedQueryReset } from '@shared/lib/useFailedQueryReset';
import { useMyAvatars } from '@entities/avatar';
import { matchRequestKeys } from '@entities/match-request';
import { useInvitationAction } from '../api/useInvitationAction';
import type { InvitationAction } from '../api/useInvitationAction';
import { useSimulationSessionsSuspense } from '../api/useSimulationSessions';
import { isRunning } from '../lib/sessions';
import type { SimulationSession } from '../lib/sessions';
import { SESSION_CARD_CLASS, SessionRow, SessionTable, SessionTableSkeleton } from './SessionTable';

const ACTION_VIEW: Record<
  InvitationAction,
  {
    label: string;
    variant: 'brand' | 'dangerSolid';
    ariaLabel: (partnerName: string) => string;
    successTitle: string;
  }
> = {
  accept: {
    label: '수락',
    variant: 'brand',
    ariaLabel: (partnerName) => `${partnerName}의 요청 수락`,
    successTitle: '요청을 수락했어요',
  },
  cancel: {
    label: '취소',
    variant: 'dangerSolid',
    ariaLabel: (partnerName) => `${partnerName}에게 보낸 요청 취소`,
    successTitle: '요청을 취소했어요',
  },
};

const ACTION_ERROR_TITLE: Partial<Record<string, string>> = {
  [SERVER_ERROR_CODES.SIMULATION_INVITATION_NOT_FOUND]: '이미 처리된 요청이에요',
  [SERVER_ERROR_CODES.SIMULATION_INVITATION_NOT_PENDING]: '이미 처리된 요청이에요',
};
const ACTION_ERROR_FALLBACK_TITLE = '잠시 후 다시 시도해주세요';

function actionErrorTitle(error: unknown): string {
  const code = isApiError(error) ? error.code : undefined;
  return (code === undefined ? undefined : ACTION_ERROR_TITLE[code]) ?? ACTION_ERROR_FALLBACK_TITLE;
}

function availableAction({ status, direction }: SimulationSession): InvitationAction | null {
  if (status !== 'PENDING') return null;
  return direction === 'RECEIVED' ? 'accept' : 'cancel';
}

type SessionActionsProps = {
  session: SimulationSession;
  acting: boolean;
  actionDisabled: boolean;
  onAction: (session: SimulationSession, action: InvitationAction) => void;
  onOpen: (simulationId: string) => void;
};

function SessionActions({
  session,
  acting,
  actionDisabled,
  onAction,
  onOpen,
}: SessionActionsProps) {
  const { partner, simulationId } = session;
  const action = availableAction(session);

  return (
    <>
      {isRunning(session.status) && simulationId === undefined && (
        <Button
          variant="secondary"
          size="xs"
          aria-label={`${partner.name} 시뮬레이션으로 이동 (준비 중)`}
          disabled
        >
          이동
        </Button>
      )}
      {simulationId !== undefined && (
        <Button
          variant="secondary"
          size="xs"
          aria-label={`${partner.name} 시뮬레이션으로 이동`}
          onClick={() => {
            onOpen(simulationId);
          }}
        >
          이동
        </Button>
      )}
      {action !== null && (
        <Button
          variant={ACTION_VIEW[action].variant}
          size="xs"
          aria-label={ACTION_VIEW[action].ariaLabel(partner.name)}
          aria-busy={acting}
          disabled={actionDisabled}
          onClick={() => {
            onAction(session, action);
          }}
        >
          {ACTION_VIEW[action].label}
        </Button>
      )}
    </>
  );
}

function SimulationSessionListContent() {
  const navigate = useNavigate();
  const { running, requests } = useSimulationSessionsSuspense();
  const { data: myAvatars = [] } = useMyAvatars();
  const colorByAvatarId = new Map(myAvatars.map((avatar) => [avatar.avatarId, avatar.color]));
  const { mutate: runAction, isPending: isActing, variables: acting } = useInvitationAction();
  const { show: showToast, dismiss: dismissToast } = useToast();
  const failureToastIdRef = useRef<string | null>(null);

  const dismissFailureToast = useCallback(() => {
    if (failureToastIdRef.current === null) return;
    dismissToast(failureToastIdRef.current);
    failureToastIdRef.current = null;
  }, [dismissToast]);

  useEffect(() => dismissFailureToast, [dismissFailureToast]);

  function handleAction(session: SimulationSession, action: InvitationAction) {
    dismissFailureToast();
    runAction(
      { invitationId: session.id, partnerAvatarId: session.partner.avatarId, action },
      {
        onSuccess: () => {
          showToast({ variant: 'success', title: ACTION_VIEW[action].successTitle });
        },
        onError: (error) => {
          failureToastIdRef.current = showToast({
            variant: 'error',
            title: actionErrorTitle(error),
          });
        },
      }
    );
  }

  function handleOpen(simulationId: string) {
    void navigate(`/sim/${encodeURIComponent(simulationId)}`);
  }

  if (running.length === 0 && requests.length === 0) {
    return (
      <div className={SESSION_CARD_CLASS}>
        <EmptyState
          icon={MessagesSquare}
          title="아직 시작한 시뮬레이션이 없어요"
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
    { title: '요청 내역', sessions: requests },
  ].filter((section) => section.sessions.length > 0);

  return (
    <>
      {sections.map(({ title, sessions }) => (
        <SessionTable key={title} title={title}>
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              myColor={colorByAvatarId.get(session.mine.avatarId)}
            >
              <SessionActions
                session={session}
                acting={isActing && acting.invitationId === session.id}
                actionDisabled={isActing}
                onAction={handleAction}
                onOpen={handleOpen}
              />
            </SessionRow>
          ))}
        </SessionTable>
      ))}
    </>
  );
}

function SimulationSessionListFallback() {
  useLoadErrorToast(true, '시뮬레이션 목록을 불러오지 못했어요');
  return <div className={cn(SESSION_CARD_CLASS, 'h-15')} />;
}

export function SimulationSessionList() {
  const ready = useFailedQueryReset(matchRequestKeys.sessions());

  return (
    <ErrorBoundary fallbackRender={() => <SimulationSessionListFallback />}>
      <Suspense fallback={<SessionTableSkeleton label="시뮬레이션 목록을 불러오는 중…" />}>
        {ready ? (
          <SimulationSessionListContent />
        ) : (
          <SessionTableSkeleton label="시뮬레이션 목록을 불러오는 중…" />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}
