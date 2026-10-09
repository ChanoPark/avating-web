import { createContext, useContext, useId } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Badge } from '@shared/ui/Badge';
import { cn } from '@shared/lib/cn';
import { AvatarIdentityTile, AvatarTagBadge } from '@entities/avatar';
import type { InvitationDirection } from '@entities/match-request';
import { formatRequestedAt } from '../lib/formatRequestedAt';
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

export const SESSION_CARD_CLASS = 'border-subtle bg-canvas rounded-card overflow-hidden border';
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
const ACTION_CELL_CLASS = 'text-center';
const ACTION_COLUMN_WIDTH = { narrow: 'w-18 sm:w-22', wide: 'w-26 sm:w-30' };
type ActionColumnWidth = keyof typeof ACTION_COLUMN_WIDTH;
const AVATAR_TILE_CLASS = 'text-caption rounded-card size-10';
const AVATAR_NAME_CLASS = 'text-body text-ink';

type TableColumns = {
  actionWidth: ActionColumnWidth;
  /** 구분(보낸 요청 · 받은 요청) 칸을 둘지. */
  showDirection: boolean;
};

const DEFAULT_COLUMNS: TableColumns = { actionWidth: 'narrow', showDirection: true };

// 머리글과 행이 같은 칸 구성을 쓰도록 표가 행에 내려 준다.
const TableColumnsContext = createContext<TableColumns>(DEFAULT_COLUMNS);

function TableHead({ actionWidth, showDirection }: TableColumns) {
  return (
    <thead>
      <tr>
        <th scope="col" className={cn(HEAD_CELL_CLASS, MY_AVATAR_COLUMN_CLASS)}>
          내 아바타
        </th>
        <th scope="col" className={cn(HEAD_CELL_CLASS, PARTNER_COLUMN_CLASS)}>
          상대 아바타
        </th>
        {showDirection && (
          <th scope="col" className={cn(HEAD_CELL_CLASS, DIRECTION_COLUMN_CLASS)}>
            구분
          </th>
        )}
        <th scope="col" className={cn(HEAD_CELL_CLASS, STATUS_COLUMN_CLASS)}>
          상태
        </th>
        <th scope="col" className={cn(HEAD_CELL_CLASS, TIME_COLUMN_CLASS)}>
          요청 시각
        </th>
        <th
          scope="col"
          className={cn(HEAD_CELL_CLASS, ACTION_CELL_CLASS, ACTION_COLUMN_WIDTH[actionWidth])}
        >
          비고
        </th>
      </tr>
    </thead>
  );
}

type SessionRowProps = {
  session: SimulationSession;
  myColor: string | undefined;
  /** 비고 칸에 놓을 버튼. */
  children?: ReactNode;
};

export function SessionRow({ session, myColor, children }: SessionRowProps) {
  const { mine, partner } = session;
  const { showDirection } = useContext(TableColumnsContext);

  return (
    <tr className={ROW_CLASS}>
      <td className={cn(CELL_CLASS, MY_AVATAR_COLUMN_CLASS)}>
        <div className={AVATAR_CELL_CLASS}>
          <AvatarIdentityTile
            name={mine.name}
            color={mine.color ?? myColor}
            className={AVATAR_TILE_CLASS}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <span className={cn(AVATAR_NAME_CLASS, 'truncate')}>{mine.name}</span>
            {mine.hashtag !== undefined && <AvatarTagBadge hashtag={mine.hashtag} />}
          </div>
        </div>
      </td>
      <td className={cn(CELL_CLASS, PARTNER_COLUMN_CLASS)}>
        <div className={AVATAR_CELL_CLASS}>
          <AvatarIdentityTile
            name={partner.name}
            color={partner.color}
            className={AVATAR_TILE_CLASS}
          />
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
            <span className="text-caption text-secondary flex flex-wrap gap-x-1.5 xl:hidden">
              <span className="sm:hidden">내 아바타 {mine.name}</span>
              {showDirection && <span>{DIRECTION_LABEL[session.direction]}</span>}
              <time dateTime={session.requestedAt} className="tnum md:hidden">
                {formatRequestedAt(session.requestedAt)}
              </time>
            </span>
          </div>
        </div>
      </td>
      {showDirection && (
        <td className={cn(CELL_CLASS, DIRECTION_COLUMN_CLASS, 'text-body text-secondary')}>
          {DIRECTION_LABEL[session.direction]}
        </td>
      )}
      <td className={cn(CELL_CLASS, STATUS_COLUMN_CLASS)}>
        <Badge variant="outline">{STATUS_LABEL[session.status]}</Badge>
      </td>
      <td className={cn(CELL_CLASS, TIME_COLUMN_CLASS, 'text-caption text-secondary tnum')}>
        <time dateTime={session.requestedAt}>{formatRequestedAt(session.requestedAt)}</time>
      </td>
      <td className={cn(CELL_CLASS, ACTION_CELL_CLASS)}>{children}</td>
    </tr>
  );
}

type SessionTableProps = Partial<TableColumns> & {
  title: string;
  children: ReactNode;
};

export function SessionTable({
  title,
  actionWidth = DEFAULT_COLUMNS.actionWidth,
  showDirection = DEFAULT_COLUMNS.showDirection,
  children,
}: SessionTableProps) {
  const headingId = useId();

  return (
    <section className="flex flex-col gap-2.5">
      <h2 id={headingId} className="text-body text-ink font-semibold">
        {title}
      </h2>
      <div className={SESSION_CARD_CLASS}>
        <table aria-labelledby={headingId} className={TABLE_CLASS}>
          <TableHead actionWidth={actionWidth} showDirection={showDirection} />
          <tbody>
            <TableColumnsContext.Provider value={{ actionWidth, showDirection }}>
              {children}
            </TableColumnsContext.Provider>
          </tbody>
        </table>
      </div>
    </section>
  );
}

type SessionTableSkeletonProps = Partial<TableColumns> & {
  label: string;
};

export function SessionTableSkeleton({
  label,
  actionWidth = DEFAULT_COLUMNS.actionWidth,
  showDirection = DEFAULT_COLUMNS.showDirection,
}: SessionTableSkeletonProps) {
  return (
    <div aria-busy="true" aria-live="polite" className={cn(SESSION_CARD_CLASS, 'animate-pulse')}>
      <span className="sr-only">{label}</span>
      <table aria-hidden="true" className={TABLE_CLASS}>
        <TableHead actionWidth={actionWidth} showDirection={showDirection} />
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
              {showDirection && <td className={cn(CELL_CLASS, DIRECTION_COLUMN_CLASS)} />}
              <td className={cn(CELL_CLASS, STATUS_COLUMN_CLASS)}>
                <span className="bg-raised mx-auto block h-5 w-16 rounded-full" />
              </td>
              <td className={cn(CELL_CLASS, TIME_COLUMN_CLASS)} />
              <td className={cn(CELL_CLASS, ACTION_CELL_CLASS)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
