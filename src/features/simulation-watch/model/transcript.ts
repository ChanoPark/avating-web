import type { Turn, TurnEvent } from '@entities/simulation';

export type TranscriptTurn =
  | { index: number; status: 'typing'; speakerAvatarId?: string }
  | { index: number; status: 'streaming'; speakerAvatarId: string; text: string; nextSeq: number }
  | {
      index: number;
      status: 'completed';
      speakerAvatarId: string;
      content: string;
      createdAt: string;
    }
  | { index: number; status: 'failed' };

export type TranscriptTerminal = 'completed' | 'failed';

export type Transcript = {
  turns: readonly TranscriptTurn[];
  terminal: TranscriptTerminal | null;
};

export type TranscriptAction =
  | { type: 'history'; turns: readonly Turn[]; completed: boolean }
  | { type: 'event'; event: TurnEvent; receivedAt: string };

export const EMPTY_TRANSCRIPT: Transcript = { turns: [], terminal: null };

function findTurn(state: Transcript, index: number): TranscriptTurn | undefined {
  return state.turns.find((turn) => turn.index === index);
}

function putTurn(turns: readonly TranscriptTurn[], next: TranscriptTurn): TranscriptTurn[] {
  return [...turns.filter((turn) => turn.index !== next.index), next].sort(
    (a, b) => a.index - b.index
  );
}

function withTurn(state: Transcript, next: TranscriptTurn): Transcript {
  return { ...state, turns: putTurn(state.turns, next) };
}

function end(state: Transcript, terminal: TranscriptTerminal): Transcript {
  return state.terminal === null ? { ...state, terminal } : state;
}

function typing(index: number, speakerAvatarId: string | undefined): TranscriptTurn {
  return { index, status: 'typing', ...(speakerAvatarId !== undefined && { speakerAvatarId }) };
}

function mergeHistory(state: Transcript, turns: readonly Turn[], completed: boolean): Transcript {
  const merged = turns.reduce<readonly TranscriptTurn[]>(
    (acc, turn) =>
      acc.some((existing) => existing.index === turn.index && existing.status === 'completed')
        ? acc
        : putTurn(acc, { ...turn, status: 'completed' }),
    state.turns
  );
  const next = merged === state.turns ? state : { ...state, turns: merged };
  return completed ? end(next, 'completed') : next;
}

function applyEvent(state: Transcript, event: TurnEvent, receivedAt: string): Transcript {
  if (event.type === 'session_completed') {
    const settled = state.turns.filter(
      (turn) => turn.status === 'completed' || turn.status === 'failed'
    );
    return end(
      settled.length === state.turns.length ? state : { ...state, turns: settled },
      'completed'
    );
  }

  const current = findTurn(state, event.turnIndex);
  if (current?.status === 'completed') return state;

  switch (event.type) {
    case 'turn_started':
      return withTurn(state, {
        index: event.turnIndex,
        status: 'streaming',
        speakerAvatarId: event.speakerAvatarId,
        text: '',
        nextSeq: 0,
      });
    case 'delta':
      if (current?.status === 'failed' || current?.status === 'typing') return state;
      if (current?.status === 'streaming' && event.seq === current.nextSeq) {
        return withTurn(state, {
          ...current,
          text: current.text + event.text,
          nextSeq: current.nextSeq + 1,
        });
      }
      return withTurn(state, typing(event.turnIndex, current?.speakerAvatarId));
    case 'turn_completed':
      return withTurn(state, {
        index: event.turnIndex,
        status: 'completed',
        speakerAvatarId: event.speakerAvatarId,
        content: event.content,
        createdAt: receivedAt,
      });
    case 'turn_failed':
      return end(withTurn(state, { index: event.turnIndex, status: 'failed' }), 'failed');
  }
}

export function reduceTranscript(state: Transcript, action: TranscriptAction): Transcript {
  return action.type === 'history'
    ? mergeHistory(state, action.turns, action.completed)
    : applyEvent(state, action.event, action.receivedAt);
}

export function lastCompletedIndex(state: Transcript): number {
  return state.turns.reduce(
    (last, turn) => (turn.status === 'completed' ? Math.max(last, turn.index) : last),
    -1
  );
}
