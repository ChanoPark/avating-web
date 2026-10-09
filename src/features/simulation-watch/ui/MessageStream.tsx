import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { AvatarIdentityTile } from '@entities/avatar';
import { cn } from '@shared/lib/cn';
import { formatTurnTime } from '../lib/formatTurnTime';
import { isNearBottom } from '../lib/isNearBottom';
import type { TranscriptTurn } from '../model/transcript';

export type Speaker = {
  name: string;
  color?: string | undefined;
  mine: boolean;
};

const META_CLASS = 'text-meta text-secondary';
const SYSTEM_LINE_CLASS = `${META_CLASS} text-center font-medium`;
const NAME_CLASS = 'text-caption text-ink max-w-full truncate font-semibold';
const BUBBLE_CLASS =
  'bg-surface text-body text-primary min-w-0 max-w-170 rounded-[16px] px-3.5 py-2.5 leading-[var(--line-body)] wrap-break-word whitespace-pre-wrap';
const TYPING_DOT_CLASS =
  'bg-muted animate-typing-dot size-1.5 rounded-full motion-reduce:animate-none motion-reduce:opacity-55';

function TypingDots() {
  return (
    <span className="flex h-5.5 items-center gap-2">
      <span className="sr-only">입력 중</span>
      <span aria-hidden="true" className={TYPING_DOT_CLASS} />
      <span aria-hidden="true" className={`${TYPING_DOT_CLASS} [animation-delay:0.2s]`} />
      <span aria-hidden="true" className={`${TYPING_DOT_CLASS} [animation-delay:0.4s]`} />
    </span>
  );
}

type MessageProps = {
  /** 늦게 들어와 turn_started 를 못 본 턴은 말하는 아바타를 모른다. */
  speaker: Speaker | null;
  /** 확정된 턴에만 있다. */
  createdAt?: string;
  /** 확정 전 턴은 조각마다 읽히지 않게 한다. */
  pending?: boolean;
  children: ReactNode;
};

function Message({ speaker, createdAt, pending = false, children }: MessageProps) {
  const mine = speaker?.mine === true;

  return (
    <article
      aria-live={pending ? 'off' : undefined}
      className={cn('flex max-w-181 flex-col gap-0.5', mine ? 'items-end self-end' : 'items-start')}
    >
      {speaker !== null && (
        <span className={cn(NAME_CLASS, mine ? 'pr-11' : 'pl-11')}>{speaker.name}</span>
      )}
      <div className={cn('flex max-w-full items-start gap-3', mine && 'flex-row-reverse')}>
        <AvatarIdentityTile
          name={speaker?.name ?? ''}
          color={speaker?.color}
          className="text-meta size-8 rounded-full"
        />
        <p className={cn(BUBBLE_CLASS, mine ? 'rounded-tr-chip' : 'rounded-tl-chip')}>{children}</p>
        {createdAt !== undefined && (
          <time dateTime={createdAt} className={`${META_CLASS} tnum -mx-1 shrink-0 self-end`}>
            {formatTurnTime(createdAt)}
          </time>
        )}
      </div>
    </article>
  );
}

type SpeakerOf = (avatarId: string | undefined) => Speaker | null;

function TurnBlock({ turn, speakerOf }: { turn: TranscriptTurn; speakerOf: SpeakerOf }) {
  switch (turn.status) {
    case 'completed':
      return (
        <Message speaker={speakerOf(turn.speakerAvatarId)} createdAt={turn.createdAt}>
          {turn.content}
        </Message>
      );
    case 'streaming':
      return (
        <Message speaker={speakerOf(turn.speakerAvatarId)} pending>
          {turn.text === '' ? <TypingDots /> : turn.text}
        </Message>
      );
    case 'typing':
      return (
        <Message speaker={speakerOf(turn.speakerAvatarId)} pending>
          <TypingDots />
        </Message>
      );
    case 'failed':
      return <p className={SYSTEM_LINE_CLASS}>이 턴을 만들지 못해 대화가 멈췄어요</p>;
  }
}

type MessageStreamProps = {
  turns: readonly TranscriptTurn[];
  speakerOf: SpeakerOf;
  emptyLabel: string;
  notice: string | null;
  /** 실시간으로 보는 대화는 맨 아래를 보고 있는 동안 새 턴을 따라 내려간다. */
  follow: boolean;
};

export function MessageStream({
  turns,
  speakerOf,
  emptyLabel,
  notice,
  follow,
}: MessageStreamProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const [turnCountWhenLeft, setTurnCountWhenLeft] = useState<number | null>(null);
  const atBottom = turnCountWhenLeft === null;
  const unseen = atBottom ? 0 : turns.length - turnCountWhenLeft;

  useLayoutEffect(() => {
    const log = logRef.current;
    if (follow && atBottom && log !== null) log.scrollTop = log.scrollHeight;
  }, [follow, atBottom, turns, notice]);

  function handleScroll() {
    const log = logRef.current;
    if (log === null) return;
    const near = isNearBottom(log);
    setTurnCountWhenLeft((left) => (near ? null : (left ?? turns.length)));
  }

  function jumpToLatest() {
    const log = logRef.current;
    if (log !== null) log.scrollTop = log.scrollHeight;
    setTurnCountWhenLeft(null);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={logRef}
        role="log"
        aria-label="대화 기록"
        tabIndex={0}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-5 pb-3"
      >
        <div className="mt-auto flex flex-col gap-4">
          {turns.map((turn) => (
            <Fragment
              key={`${String(turn.index)}-${turn.status === 'completed' ? 'done' : 'live'}`}
            >
              <TurnBlock turn={turn} speakerOf={speakerOf} />
            </Fragment>
          ))}
          {turns.length === 0 && <p className={SYSTEM_LINE_CLASS}>{emptyLabel}</p>}
          {notice !== null && <p className={SYSTEM_LINE_CLASS}>{notice}</p>}
        </div>
      </div>
      {unseen > 0 && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="bg-ink text-on-ink hover:bg-ink-hover active:bg-ink-press text-meta tnum ease-standard absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full px-3 py-2 leading-none font-semibold transition-colors duration-[var(--dur-fast)] after:absolute after:-inset-2"
        >
          <ArrowDown size={12} strokeWidth={2} aria-hidden="true" />새 메시지 {unseen}개
        </button>
      )}
    </div>
  );
}
