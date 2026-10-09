import { Suspense, useId } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { cn } from '@shared/lib/cn';
import { useMyAvatars } from '@entities/avatar';
import { formatRequestedAt, useWatchSessionsSuspense } from '@features/simulation-list';
import type { SimulationSession } from '@features/simulation-list';
import { useSessionPaneStore } from '../model/sessionPaneStore';
import { AvatarNameLine } from './AvatarNameLine';
import { AvatarPair } from './AvatarPair';

const ROW_CLASS = 'flex h-18 items-center gap-3 px-4';
const ROW_LINE_CLASS = 'flex items-center justify-between gap-2';

// 상태는 글자 없이 동그라미 색으로만 보인다 — 이름은 스크린리더와 툴팁에 남긴다.
const STATUS_DOT: Partial<
  Record<SimulationSession['status'], { label: string; className: string }>
> = {
  ACCEPTED: { label: '진행 중', className: 'bg-id-blue motion-safe:animate-pulse' },
  IN_PROGRESS: { label: '진행 중', className: 'bg-id-blue motion-safe:animate-pulse' },
  DONE: { label: '종료', className: 'bg-id-none' },
  ABORTED: { label: '중단', className: 'bg-id-orange' },
};

type SessionLinkProps = {
  session: SimulationSession;
  simulationId: string;
  myColor: string | undefined;
  selected: boolean;
};

function SessionLink({ session, simulationId, myColor, selected }: SessionLinkProps) {
  const { partner } = session;
  const mine = { ...session.mine, color: session.mine.color ?? myColor };
  const status = STATUS_DOT[session.status];

  return (
    <Link
      to={`/sim/${encodeURIComponent(simulationId)}`}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        ROW_CLASS,
        'group ease-standard transition-colors duration-[var(--dur-fast)] focus-visible:-outline-offset-2',
        selected ? 'bg-raised' : 'hover:bg-row-hover'
      )}
    >
      <AvatarPair
        mine={mine}
        partner={partner}
        haloClass={selected ? 'ring-raised' : 'ring-canvas group-hover:ring-surface'}
      />
      <span className="text-body text-primary flex min-w-0 flex-1 flex-col leading-[var(--line-body)] font-medium">
        <span className={ROW_LINE_CLASS}>
          <AvatarNameLine avatar={mine} />
          <time
            dateTime={session.requestedAt}
            className="text-caption text-secondary tnum shrink-0 font-normal whitespace-nowrap"
          >
            {formatRequestedAt(session.requestedAt)}
          </time>
        </span>
        <span className={ROW_LINE_CLASS}>
          <AvatarNameLine avatar={partner} />
          {status !== undefined && (
            <span
              role="img"
              aria-label={status.label}
              title={status.label}
              className={cn('h-[9px] w-[9px] shrink-0 rounded-full', status.className)}
            />
          )}
        </span>
      </span>
    </Link>
  );
}

function SessionLinks({ selectedId }: { selectedId: string }) {
  const { running, ended } = useWatchSessionsSuspense();
  const { data: myAvatars = [] } = useMyAvatars();
  const colorByAvatarId = new Map(myAvatars.map((avatar) => [avatar.avatarId, avatar.color]));

  return (
    <ul>
      {[...running, ...ended].map((session) =>
        session.simulationId === undefined ? null : (
          <li key={session.id}>
            <SessionLink
              session={session}
              simulationId={session.simulationId}
              myColor={colorByAvatarId.get(session.mine.avatarId)}
              selected={session.simulationId === selectedId}
            />
          </li>
        )
      )}
    </ul>
  );
}

function SessionLinksSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={ROW_CLASS}>
          <span className="bg-raised size-10 shrink-0 rounded-full" />
          <span className="bg-raised rounded-chip h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

// 목록을 못 받으면 같은 쿼리에 기대는 대화 쪽이 실패를 알린다 — 여기서는 자리만 비운다.
export function SessionListPane({ selectedId }: { selectedId: string }) {
  const collapsed = useSessionPaneStore((s) => s.collapsed);
  const toggle = useSessionPaneStore((s) => s.toggle);
  const listId = useId();
  const ToggleIcon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <nav
      aria-label="시뮬레이션 목록"
      className={cn(
        'border-subtle hidden shrink-0 flex-col border-r lg:flex',
        collapsed ? 'w-12' : 'w-70 2xl:w-80'
      )}
    >
      <div id={listId} className="min-h-0 flex-1 overflow-y-auto">
        {!collapsed && (
          <ErrorBoundary fallback={null}>
            <Suspense fallback={<SessionLinksSkeleton />}>
              <SessionLinks selectedId={selectedId} />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
      <div className={cn('flex shrink-0 p-2', collapsed ? 'justify-center' : 'justify-end')}>
        <Button
          variant="ghost"
          size="sm"
          icon
          aria-label={collapsed ? '시뮬레이션 목록 펼치기' : '시뮬레이션 목록 접기'}
          aria-expanded={!collapsed}
          aria-controls={listId}
          onClick={toggle}
        >
          <ToggleIcon size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
