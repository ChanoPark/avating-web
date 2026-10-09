import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseTurnEvent, sessionTurnsSchema } from '../model';

const turn = {
  index: 0,
  speakerAvatarId: '11111111-1111-4111-8111-111111111111',
  content: '안녕하세요, 오늘 날씨 좋네요.',
  finishReason: 'STOP',
  createdAt: '2026-08-17T04:12:00Z',
};

describe('sessionTurnsSchema (avating-ai GET /v1/sessions/{sessionId}/turns)', () => {
  it('봉투 없이 최상위가 곧 payload 인 응답을 파싱한다', () => {
    const parsed = sessionTurnsSchema.parse({
      sessionId: 'sim-1',
      turns: [turn],
      completed: false,
    });
    expect(parsed.completed).toBe(false);
    expect(parsed.turns[0]).toMatchObject({
      index: 0,
      speakerAvatarId: turn.speakerAvatarId,
      content: turn.content,
      createdAt: turn.createdAt,
    });
  });

  it('core 처럼 { data } 봉투로 감싼 응답은 거부한다', () => {
    expect(() =>
      sessionTurnsSchema.parse({ data: { sessionId: 'sim-1', turns: [], completed: true } })
    ).toThrow();
  });

  it('턴이 하나도 없는 세션을 파싱한다', () => {
    expect(
      sessionTurnsSchema.parse({ sessionId: 'sim-1', turns: [], completed: false }).turns
    ).toEqual([]);
  });

  it('createdAt 은 Z 와 +09:00 오프셋을 둘 다 받는다', () => {
    for (const createdAt of ['2026-08-17T04:12:00Z', '2026-08-17T13:12:00+09:00']) {
      expect(() =>
        sessionTurnsSchema.parse({
          sessionId: 'sim-1',
          turns: [{ ...turn, createdAt }],
          completed: true,
        })
      ).not.toThrow();
    }
  });

  it('createdAt 이 ISO-8601 이 아니면 거부한다', () => {
    expect(() =>
      sessionTurnsSchema.parse({
        sessionId: 'sim-1',
        turns: [{ ...turn, createdAt: '방금' }],
        completed: true,
      })
    ).toThrow();
  });

  it('completed 가 빠지면 거부한다', () => {
    expect(() => sessionTurnsSchema.parse({ sessionId: 'sim-1', turns: [turn] })).toThrow();
  });
});

describe('parseTurnEvent (avating-ai SSE data)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { type: 'turn_started', turnIndex: 3, speakerAvatarId: 'avatar-a' },
    { type: 'delta', turnIndex: 3, seq: 0, text: '조각' },
    {
      type: 'turn_completed',
      turnIndex: 3,
      speakerAvatarId: 'avatar-a',
      content: '확정된 문장',
      finishReason: 'STOP',
    },
    { type: 'turn_failed', turnIndex: 3, reason: 'stream-truncated' },
    { type: 'session_completed', lastTurnIndex: 19 },
  ])('$type 이벤트를 파싱한다', (event) => {
    expect(parseTurnEvent(JSON.stringify(event))).toMatchObject({
      type: event.type,
    });
  });

  it('delta 는 turnIndex · seq · text 만 와도(null 필드는 키째 빠진다) 파싱한다', () => {
    expect(parseTurnEvent('{"type":"delta","turnIndex":3,"seq":0,"text":"조각"}')).toEqual({
      type: 'delta',
      turnIndex: 3,
      seq: 0,
      text: '조각',
    });
  });

  it('reason 없는 turn_failed 도 받는다', () => {
    expect(parseTurnEvent('{"type":"turn_failed","turnIndex":2}')).toEqual({
      type: 'turn_failed',
      turnIndex: 2,
    });
  });

  it('모르는 type 은 조용히 버린다 (나중에 추가될 이벤트에 화면이 죽지 않게)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(parseTurnEvent('{"type":"coaching_applied","turnIndex":3}')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('아는 type 인데 모양이 틀리면 그 이벤트만 버리고 경고를 남긴다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(parseTurnEvent('{"type":"delta","turnIndex":"3","seq":0,"text":"x"}')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('JSON 이 아닌 data 는 버리고 경고를 남긴다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(parseTurnEvent('{"type":"delta"')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
