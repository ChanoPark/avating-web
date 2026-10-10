import { describe, it, expect } from 'vitest';
import type { Turn, TurnEvent } from '@entities/simulation';
import {
  EMPTY_TRANSCRIPT,
  lastCompletedIndex,
  reduceTranscript,
  type Transcript,
} from '../model/transcript';

const AT = '2026-10-09T05:00:00.000Z';

function turn(index: number, content = `턴 ${String(index)}`): Turn {
  return { index, speakerAvatarId: index % 2 === 0 ? 'a' : 'b', content, createdAt: AT };
}

function history(turns: Turn[], completed = false, from: Transcript = EMPTY_TRANSCRIPT) {
  return reduceTranscript(from, { type: 'history', turns, completed });
}

function play(events: TurnEvent[], from: Transcript = EMPTY_TRANSCRIPT): Transcript {
  return events.reduce<Transcript>(
    (state, event) => reduceTranscript(state, { type: 'event', event, receivedAt: AT }),
    from
  );
}

const started = (turnIndex: number, speakerAvatarId = 'a'): TurnEvent => ({
  type: 'turn_started',
  turnIndex,
  speakerAvatarId,
});
const delta = (turnIndex: number, seq: number, text: string): TurnEvent => ({
  type: 'delta',
  turnIndex,
  seq,
  text,
});
const completed = (turnIndex: number, content: string, speakerAvatarId = 'a'): TurnEvent => ({
  type: 'turn_completed',
  turnIndex,
  speakerAvatarId,
  content,
});

describe('reduceTranscript — 기록(REST)', () => {
  it('확정 턴 묶음을 turnIndex 순으로 담는다', () => {
    const state = history([turn(1), turn(0)]);
    expect(state.turns.map((t) => [t.index, t.status])).toEqual([
      [0, 'completed'],
      [1, 'completed'],
    ]);
    expect(state.terminal).toBeNull();
  });

  it('completed 인 기록은 대화를 끝난 것으로 표시한다', () => {
    expect(history([turn(0)], true).terminal).toBe('completed');
  });

  it('기록을 다시 받아도 스트림으로 받은 턴이 사라지지 않고, 이미 확정된 턴은 참조가 그대로다', () => {
    const live = play([completed(1, '스트림으로 받은 턴', 'b')], history([turn(0)]));
    const merged = history([turn(0)], false, live);

    expect(merged.turns.map((t) => t.index)).toEqual([0, 1]);
    expect(merged.turns[0]).toBe(live.turns[0]);
    expect(merged.turns[1]).toBe(live.turns[1]);
  });

  it('스트림으로 확정된 턴은 기록을 다시 받으면 서버가 준 시각으로 바뀐다', () => {
    const live = play([completed(1, '스트림으로 받은 턴', 'b')], history([turn(0)]));
    const serverAt = '2026-10-09T04:58:00.000Z';
    const merged = history(
      [
        turn(0),
        { index: 1, speakerAvatarId: 'b', content: '스트림으로 받은 턴', createdAt: serverAt },
      ],
      false,
      live
    );

    expect(merged.turns[1]).toMatchObject({ status: 'completed', createdAt: serverAt });
    expect(merged.turns[0]).toBe(live.turns[0]);
  });
});

describe('reduceTranscript — 이벤트(SSE)', () => {
  it('turn_started → delta → turn_completed 로 스트리밍하다 확정본으로 바뀐다', () => {
    const streaming = play([started(0), delta(0, 0, '안녕'), delta(0, 1, '하세요')]);
    expect(streaming.turns).toEqual([
      { index: 0, status: 'streaming', speakerAvatarId: 'a', text: '안녕하세요', nextSeq: 2 },
    ]);

    const done = play([completed(0, '안녕하세요.')], streaming);
    expect(done.turns).toEqual([
      {
        index: 0,
        status: 'completed',
        speakerAvatarId: 'a',
        content: '안녕하세요.',
        createdAt: AT,
      },
    ]);
  });

  it('turn_started 를 못 본 턴의 delta 는 글자를 보이지 않고 입력 중으로만 둔다', () => {
    const state = play([delta(4, 7, '중간부터')]);
    expect(state.turns).toEqual([{ index: 4, status: 'typing' }]);

    expect(play([delta(4, 8, ' 이어서')], state).turns).toEqual([{ index: 4, status: 'typing' }]);
  });

  it('입력 중이던 턴도 turn_completed 가 오면 전문으로 바뀐다', () => {
    const state = play([delta(4, 7, '중간부터'), completed(4, '처음부터 끝까지')]);
    expect(state.turns[0]).toMatchObject({ status: 'completed', content: '처음부터 끝까지' });
  });

  it('delta 의 seq 가 끊기면 모은 글자를 버리고 입력 중으로 내린다', () => {
    const state = play([started(0), delta(0, 0, '안녕'), delta(0, 2, '세요')]);
    expect(state.turns).toEqual([{ index: 0, status: 'typing', speakerAvatarId: 'a' }]);
  });

  it('같은 seq 가 두 번 와도 끊긴 것으로 본다', () => {
    const state = play([started(0), delta(0, 0, '안녕'), delta(0, 0, '안녕')]);
    expect(state.turns[0]?.status).toBe('typing');
  });

  it('turn_completed.content 는 델타로 모은 글자를 믿지 않고 항상 덮어쓴다', () => {
    const state = play([started(0), delta(0, 0, '모은 글자'), completed(0, '확정본')]);
    expect(state.turns[0]).toMatchObject({ status: 'completed', content: '확정본' });
  });

  it('같은 turn_completed 가 두 번 와도 결과와 참조가 같다', () => {
    const once = play([completed(0, '확정본')]);
    const twice = play([completed(0, '확정본')], once);
    expect(twice).toBe(once);
  });

  it('확정된 턴에 늦게 온 turn_started · delta · turn_failed 는 무시한다', () => {
    const done = play([completed(0, '확정본')]);
    const late = play(
      [started(0), delta(0, 0, '늦은 조각'), { type: 'turn_failed', turnIndex: 0, reason: 'x' }],
      done
    );
    expect(late).toBe(done);
  });

  it('기록으로 확정된 턴과 겹치는 이벤트도 무시한다', () => {
    const base = history([turn(0, '기록')]);
    expect(play([started(0), delta(0, 0, '겹침')], base)).toBe(base);
  });

  it('turn_failed 는 그 턴을 실패로 두고 대화를 멈춘 것으로 표시한다', () => {
    const state = play([
      started(2),
      delta(2, 0, '쓰다가'),
      { type: 'turn_failed', turnIndex: 2, reason: 'stream-truncated' },
    ]);
    expect(state.turns).toEqual([{ index: 2, status: 'failed' }]);
    expect(state.terminal).toBe('failed');
  });

  it('session_completed 는 대화를 끝난 것으로 표시하고 확정되지 않은 턴을 걷는다', () => {
    const state = play([
      completed(0, '확정본'),
      started(1, 'b'),
      { type: 'session_completed', lastTurnIndex: 0 },
    ]);
    expect(state.turns.map((t) => t.index)).toEqual([0]);
    expect(state.terminal).toBe('completed');
  });

  it('한 번 끝난 대화는 다시 열리지 않는다', () => {
    const failed = play([{ type: 'turn_failed', turnIndex: 0 }]);
    expect(play([{ type: 'session_completed', lastTurnIndex: 0 }], failed).terminal).toBe('failed');
    expect(history([turn(0)], false, history([turn(0)], true)).terminal).toBe('completed');
  });

  it('바뀌지 않은 턴은 참조를 유지한다', () => {
    const base = history([turn(0), turn(1)]);
    const next = play([started(2), delta(2, 0, '새 턴')], base);
    expect(next.turns[0]).toBe(base.turns[0]);
    expect(next.turns[1]).toBe(base.turns[1]);
  });
});

describe('lastCompletedIndex', () => {
  it('확정된 턴 중 가장 큰 turnIndex 다 — 스트리밍 중인 턴은 세지 않는다', () => {
    expect(lastCompletedIndex(play([started(2)], history([turn(0), turn(1)])))).toBe(1);
  });

  it('확정된 턴이 없으면 -1 이다', () => {
    expect(lastCompletedIndex(EMPTY_TRANSCRIPT)).toBe(-1);
    expect(lastCompletedIndex(play([started(0)]))).toBe(-1);
  });
});
