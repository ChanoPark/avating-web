import { Suspense, useCallback, useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Link, useNavigate } from 'react-router';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { useToast } from '@shared/ui/Toast/useToast';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';
import { SERVER_ERROR_CODES } from '@shared/api/errorCodes';
import { cn } from '@shared/lib/cn';
import { isApiError } from '@shared/lib/errors';
import { useFailedQueryReset } from '@shared/lib/useFailedQueryReset';
import { AvatarIdentityTile, AvatarTagBadge, useMyAvatars } from '@entities/avatar';
import { matchRequestKeys } from '@entities/match-request';
import type { InvitationDirection } from '@entities/match-request';
import { useInvitationAction } from '../api/useInvitationAction';
import type { InvitationAction } from '../api/useInvitationAction';
import { useSimulationSessionsSuspense } from '../api/useSimulationSessions';
import { formatRequestedAt } from '../lib/formatRequestedAt';
import { isRunning } from '../lib/sessions';
import type { SessionStatus, SimulationSession } from '../lib/sessions';

const STATUS_LABEL: Record<SessionStatus, string> = {
  PENDING: '응답 대기',
  ACCEPTED: '진행 중',
  IN_PROGRESS: '진행 중',
  DONE: '종료',
  ABORTED: '중단',
  CANCELED: '취소',
};

const DIRECTION_LABEL: Record<InvitationDirection, string> = {
  SENT: '보낸 요청',
  RECEIVED: '받은 요청',
};

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

const CARD_CLASS = 'border-subtle bg-canvas rounded-card overflow-hidden border';
const TABLE_CLASS = 'w-full table-fixed border-collapse';
const HEAD_CELL_CLASS = 'text-caption text-secondary px-3 py-3 font-medium sm:px-5';
const ROW_CLASS = 'border-subtle border-t';
const CELL_CLASS = 'px-3 py-2.5 sm:px-5';
const MY_AVATAR_COLUMN_CLASS = 'text-center max-sm:hidden';
const PARTNER_COLUMN_CLASS = 'text-center';
const AVATAR_CELL_CLASS = 'mx-auto flex w-full max-w-60 items-center gap-3 text-left';
const DIRECTION_COLUMN_CLASS = 'w-24 text-center max-xl:hidden';
const STATUS_COLUMN_CLASS = 'w-28 text-center sm:w-32';
const TIME_COLUMN_CLASS = 'w-36 text-center max-md:hidden';
const ACTION_COLUMN_CLASS = 'w-18 text-center sm:w-22';
const AVATAR_TILE_CLASS = 'text-caption rounded-card size-10';
const AVATAR_NAME_CLASS = 'text-body text-ink';

function TableHead() {
  return (
    <thead>
      <tr>
        <th scope="col" className={cn(HEAD_CELL_CLASS, MY_AVATAR_COLUMN_CLASS)}>
          내 아바타
        </th>
        <th scope="col" className={cn(HEAD_CELL_CLASS, PARTNER_COLUMN_CLASS)}>
          상대 아바타
        </th>
        <th scope="col" className={cn(HEAD_CELL_CLASS, DIRECTION_COLUMN_CLASS)}>
          구분
        </th>
        <th scope="col" className={cn(HEAD_CELL_CLASS, STATUS_COLUMN_CLASS)}>
          상태
        </th>
        <th scope="col" className={cn(HEAD_CELL_CLASS, TIME_COLUMN_CLASS)}>
          요청 시각
        </th>
        <th scope="col" className={cn(HEAD_CELL_CLASS, ACTION_COLUMN_CLASS)}>
          비고
        </th>
      </tr>
    </thead>
  );
}

type SessionRowProps = {
  session: SimulationSession;
  myColor: string | undefined;
  acting: boolean;
  actionDisabled: boolean;
  onAction: (session: SimulationSession, action: InvitationAction) => void;
};

function SessionRow({ session, myColor, acting, actionDisabled, onAction }: SessionRowProps) {
  const { mine, partner } = session;
  const action = availableAction(session);

  return (
    <tr className={ROW_CLASS}>
      <td className={cn(CELL_CLASS, MY_AVATAR_COLUMN_CLASS)}>
        <div className={AVATAR_CELL_CLASS}>
          <AvatarIdentityTile name={mine.name} color={myColor} className={AVATAR_TILE_CLASS} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className={cn(AVATAR_NAME_CLASS, 'truncate')}>{mine.name}</span>
            {mine.hashtag !== undefined && <AvatarTagBadge hashtag={mine.hashtag} />}
          </div>
        </div>
      </td>
      <td className={cn(CELL_CLASS, PARTNER_COLUMN_CLASS)}>
        <div className={AVATAR_CELL_CLASS}>
          <AvatarIdentityTile name={partner.name} className={AVATAR_TILE_CLASS} />
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              to={`/avatars/${partner.avatarId}`}
              className={cn(
                AVATAR_NAME_CLASS,
                'rounded-chip relative flex w-fit max-w-full underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-2.5 hover:underline'
              )}
            >
              <span className="truncate">{partner.name}</span>
            </Link>
            {partner.hashtag !== undefined && <AvatarTagBadge hashtag={partner.hashtag} />}
            <span className="text-caption text-secondary truncate sm:hidden">
              내 아바타 {mine.name}
            </span>
          </div>
        </div>
      </td>
      <td className={cn(CELL_CLASS, DIRECTION_COLUMN_CLASS, 'text-body text-secondary')}>
        {DIRECTION_LABEL[session.direction]}
      </td>
      <td className={cn(CELL_CLASS, STATUS_COLUMN_CLASS)}>
        <Badge variant="outline">{STATUS_LABEL[session.status]}</Badge>
      </td>
      <td className={cn(CELL_CLASS, TIME_COLUMN_CLASS, 'text-caption text-secondary tnum')}>
        <time dateTime={session.requestedAt}>{formatRequestedAt(session.requestedAt)}</time>
      </td>
      <td className={cn(CELL_CLASS, ACTION_COLUMN_CLASS)}>
        {isRunning(session.status) && (
          <Button
            variant="secondary"
            size="xs"
            aria-label={`${partner.name} 시뮬레이션으로 이동 (준비 중)`}
            disabled
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
      </td>
    </tr>
  );
}

function SessionTable({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();

  return (
    <section className="flex flex-col gap-2.5">
      <h2 id={headingId} className="text-body text-ink font-semibold">
        {title}
      </h2>
      <div className={CARD_CLASS}>
        <table aria-labelledby={headingId} className={TABLE_CLASS}>
          <TableHead />
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
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
      { invitationId: session.id, action },
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

  if (running.length === 0 && requests.length === 0) {
    return (
      <div className="bg-surface rounded-card flex flex-col items-start gap-4 p-8">
        <p className="text-body text-ink font-semibold">아직 시작한 시뮬레이션이 없어요</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigate('/explore');
          }}
        >
          추천 아바타 보기
        </Button>
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
              acting={isActing && acting.invitationId === session.id}
              actionDisabled={isActing}
              onAction={handleAction}
            />
          ))}
        </SessionTable>
      ))}
    </>
  );
}

function SimulationSessionListFallback() {
  useLoadErrorToast(true, '시뮬레이션 목록을 불러오지 못했어요');
  return <div className={cn(CARD_CLASS, 'h-15')} />;
}

function SimulationSessionListSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className={cn(CARD_CLASS, 'animate-pulse')}>
      <span className="sr-only">시뮬레이션 목록을 불러오는 중…</span>
      <table aria-hidden="true" className={TABLE_CLASS}>
        <TableHead />
        <tbody>
          {Array.from({ length: 3 }, (_, i) => (
            <tr key={i} className={ROW_CLASS}>
              {[MY_AVATAR_COLUMN_CLASS, PARTNER_COLUMN_CLASS].map((columnClass) => (
                <td key={columnClass} className={cn(CELL_CLASS, columnClass)}>
                  <div className={AVATAR_CELL_CLASS}>
                    <span className="bg-raised rounded-card size-10 shrink-0" />
                    <span className="text-body bg-raised rounded-chip w-20">&nbsp;</span>
                  </div>
                </td>
              ))}
              <td className={cn(CELL_CLASS, DIRECTION_COLUMN_CLASS)} />
              <td className={cn(CELL_CLASS, STATUS_COLUMN_CLASS)}>
                <span className="bg-raised mx-auto block h-5 w-16 rounded-full" />
              </td>
              <td className={cn(CELL_CLASS, TIME_COLUMN_CLASS)} />
              <td className={cn(CELL_CLASS, ACTION_COLUMN_CLASS)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SimulationSessionList() {
  const ready = useFailedQueryReset(matchRequestKeys.sessions());

  return (
    <ErrorBoundary fallbackRender={() => <SimulationSessionListFallback />}>
      <Suspense fallback={<SimulationSessionListSkeleton />}>
        {ready ? <SimulationSessionListContent /> : <SimulationSessionListSkeleton />}
      </Suspense>
    </ErrorBoundary>
  );
}
