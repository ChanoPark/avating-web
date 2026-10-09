import { useEffect } from 'react';
import { useMyAvatars } from '@entities/avatar';
import { isRunning, useSimulationSessionSuspense } from '@features/simulation-list';
import type { SimulationSession } from '@features/simulation-list';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';
import { ApiError } from '@shared/lib/errors';
import { useSimulationWatch } from '../api/useSimulationWatch';
import type { WatchTiming } from '../api/watchTurnStream';
import type { TranscriptTerminal } from '../model/transcript';
import { AvatarNameLine } from './AvatarNameLine';
import { AvatarPair } from './AvatarPair';
import { MessageStream } from './MessageStream';
import type { Speaker } from './MessageStream';

function endNotice(
  status: SimulationSession['status'],
  terminal: TranscriptTerminal | null
): string | null {
  if (status === 'ABORTED' || terminal === 'failed') return '세션이 중단됐어요';
  if (terminal === 'completed' || !isRunning(status)) return '세션이 종료됐어요';
  return null;
}

type WatchedSessionProps = {
  sessionId: string;
  session: SimulationSession;
  streamTiming?: WatchTiming | undefined;
};

function WatchedSession({ sessionId, session, streamTiming }: WatchedSessionProps) {
  const { transcript, live, reconnecting } = useSimulationWatch(sessionId, {
    running: isRunning(session.status),
    timing: streamTiming,
  });
  const { data: myAvatars = [] } = useMyAvatars();
  const setBreadcrumbTrail = useChromeBreadcrumbStore((s) => s.setTrail);
  const clearBreadcrumbTrail = useChromeBreadcrumbStore((s) => s.clearTrail);

  const { partner } = session;
  const mine = {
    ...session.mine,
    color:
      session.mine.color ??
      myAvatars.find((avatar) => avatar.avatarId === session.mine.avatarId)?.color,
  };
  const title = `${mine.name} × ${partner.name}`;
  const notice = endNotice(session.status, transcript.terminal);

  useEffect(() => {
    setBreadcrumbTrail([
      { label: '아바타', to: '/explore' },
      { label: '시뮬레이션', to: '/sim' },
      { label: title },
    ]);
    return () => {
      clearBreadcrumbTrail();
    };
  }, [title, setBreadcrumbTrail, clearBreadcrumbTrail]);

  function speakerOf(avatarId: string | undefined): Speaker | null {
    if (avatarId === undefined) return null;
    return avatarId === mine.avatarId
      ? { name: mine.name, color: mine.color, mine: true }
      : { name: partner.name, color: partner.color, mine: false };
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-subtle flex h-16 shrink-0 items-center border-b px-6">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarPair mine={mine} partner={partner} />
          <h1 className="text-body text-ink flex min-w-0 flex-col leading-[var(--line-body)] font-semibold">
            <AvatarNameLine avatar={mine} />
            <AvatarNameLine avatar={partner} />
          </h1>
        </div>
      </header>
      {reconnecting && (
        <div
          role="status"
          className="bg-raised text-caption text-secondary flex shrink-0 items-center gap-2 px-4 py-2 leading-[var(--line-meta)]"
        >
          연결이 끊겨 다시 연결하고 있어요
        </div>
      )}
      <MessageStream
        turns={transcript.turns}
        speakerOf={speakerOf}
        emptyLabel={notice === null ? '대화가 곧 시작돼요' : '나눈 대화가 없어요'}
        notice={notice}
        follow={live}
      />
      {notice !== null && (
        <div className="border-subtle bg-surface flex shrink-0 items-center gap-3 border-t px-4 py-3">
          <p className="text-body text-secondary min-w-0 flex-1 leading-[var(--line-body)]">
            이 대화는 끝났어요
          </p>
        </div>
      )}
    </div>
  );
}

type SimulationWatchProps = {
  sessionId: string;
  streamTiming?: WatchTiming;
};

export function SimulationWatch({ sessionId, streamTiming }: SimulationWatchProps) {
  const session = useSimulationSessionSuspense(sessionId);
  if (session === undefined) throw new ApiError(404, `Simulation ${sessionId} not found`);
  return (
    <WatchedSession
      key={sessionId}
      sessionId={sessionId}
      session={session}
      streamTiming={streamTiming}
    />
  );
}
