import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { configureHttpAuth, resetHttpAuth } from '@shared/api/http';
import type { TurnEvent } from '@entities/simulation';
import { watchTurnStream, type StreamConnection, type WatchTiming } from '../api/watchTurnStream';

const CORE_URL = import.meta.env.VITE_API_BASE_URL as string;
const AI_URL = import.meta.env.VITE_AI_API_BASE_URL as string;
const STREAM_URL = `${AI_URL}/v1/sessions/:sessionId/stream`;

const FAST: WatchTiming = { idleTimeoutMs: 400, retryDelaysMs: [5, 5, 5] };

const encoder = new TextEncoder();

function frame(event: TurnEvent): Uint8Array {
  return encoder.encode(`event:${event.type}\ndata:${JSON.stringify(event)}\n\n`);
}

type StreamScript = { events: TurnEvent[]; then: 'close' | 'hang' | 'error' };

function sseResponse({ events, then }: StreamScript): Response {
  let delivered = false;
  return new HttpResponse(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        if (!delivered) {
          delivered = true;
          for (const event of events) controller.enqueue(frame(event));
          if (events.length > 0) return;
        }
        if (then === 'close') controller.close();
        if (then === 'error') {
          // 바로 error 를 내면 앞서 넣은 chunk 가 읽히기 전에 버려진다.
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              controller.error(new Error('connection reset'));
              resolve();
            }, 20);
          });
        }
        if (then === 'hang') return new Promise<void>(() => undefined);
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  );
}

/** 연결마다 차례로 다른 응답을 내고, 받은 afterTurnIndex 를 기록한다. 마지막 응답은 계속 쓴다. */
function scriptStream(responses: (() => Response)[]) {
  const cursors: (string | null)[] = [];
  server.use(
    mswHttp.get(STREAM_URL, ({ request }) => {
      cursors.push(new URL(request.url).searchParams.get('afterTurnIndex'));
      const respond = responses[Math.min(cursors.length, responses.length) - 1];
      if (respond === undefined) throw new Error('응답 스크립트가 비었다');
      return respond();
    })
  );
  return cursors;
}

function watch(overrides: { afterTurnIndex?: number; timing?: WatchTiming; signal?: AbortSignal }) {
  const events: TurnEvent[] = [];
  const connections: StreamConnection[] = [];
  const result = watchTurnStream({
    sessionId: 'sim-1',
    afterTurnIndex: overrides.afterTurnIndex ?? -1,
    onEvent: (event) => events.push(event),
    onConnectionChange: (connection) => connections.push(connection),
    signal: overrides.signal ?? new AbortController().signal,
    timing: overrides.timing ?? FAST,
  });
  return { events, connections, result };
}

const completed = (turnIndex: number): TurnEvent => ({
  type: 'turn_completed',
  turnIndex,
  speakerAvatarId: 'a',
  content: `턴 ${String(turnIndex)}`,
});
const sessionCompleted = (lastTurnIndex: number): TurnEvent => ({
  type: 'session_completed',
  lastTurnIndex,
});

describe('watchTurnStream', () => {
  beforeEach(() => {
    resetHttpAuth();
    configureHttpAuth({
      getAccessToken: () => 'access-1',
      getRefreshToken: () => 'refresh-1',
      onTokenRefreshed: () => undefined,
      onUnauthorized: () => undefined,
    });
  });

  afterEach(() => {
    resetHttpAuth();
    vi.restoreAllMocks();
  });

  it('afterTurnIndex 로 구독해 이벤트를 순서대로 넘기고, session_completed 에서 끝난다', async () => {
    const cursors = scriptStream([
      () => sseResponse({ events: [completed(3), sessionCompleted(3)], then: 'hang' }),
    ]);

    const { events, connections, result } = watch({ afterTurnIndex: 2 });

    await expect(result).resolves.toBe('ended');
    expect(cursors).toEqual(['2']);
    expect(events.map((event) => event.type)).toEqual(['turn_completed', 'session_completed']);
    expect(connections).toEqual(['open']);
  });

  it('Accept: text/event-stream 과 Bearer 토큰을 싣는다', async () => {
    let headers: Headers | undefined;
    server.use(
      mswHttp.get(STREAM_URL, ({ request }) => {
        headers = request.headers;
        return sseResponse({ events: [sessionCompleted(0)], then: 'close' });
      })
    );

    await watch({}).result;
    expect(headers?.get('Accept')).toBe('text/event-stream');
    expect(headers?.get('Authorization')).toBe('Bearer access-1');
  });

  it('서버가 연결을 닫으면 마지막으로 확정된 턴 다음부터 다시 구독한다', async () => {
    const cursors = scriptStream([
      () => sseResponse({ events: [completed(0), completed(1)], then: 'close' }),
      () => sseResponse({ events: [completed(2), sessionCompleted(2)], then: 'close' }),
    ]);

    const { events, connections, result } = watch({});

    await expect(result).resolves.toBe('ended');
    expect(cursors).toEqual(['-1', '1']);
    expect(events.filter((e) => e.type === 'turn_completed').map((e) => e.turnIndex)).toEqual([
      0, 1, 2,
    ]);
    expect(connections).toEqual(['open', 'reconnecting', 'open']);
  });

  it('스트림이 도중에 끊겨도(네트워크 오류) 다시 구독한다', async () => {
    const cursors = scriptStream([
      () => sseResponse({ events: [completed(0)], then: 'error' }),
      () => sseResponse({ events: [sessionCompleted(0)], then: 'close' }),
    ]);

    await expect(watch({}).result).resolves.toBe('ended');
    expect(cursors).toEqual(['-1', '0']);
  });

  it('요청 자체가 실패해도 다시 시도한다', async () => {
    const cursors = scriptStream([
      () => HttpResponse.error(),
      () => sseResponse({ events: [sessionCompleted(0)], then: 'close' }),
    ]);

    await expect(watch({}).result).resolves.toBe('ended');
    expect(cursors).toHaveLength(2);
  });

  it('404(세션 등록 전)와 5xx 는 다시 시도한다', async () => {
    const cursors = scriptStream([
      () => HttpResponse.json({ code: 'SESSION_NOT_FOUND' }, { status: 404 }),
      () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 503 }),
      () => sseResponse({ events: [sessionCompleted(0)], then: 'close' }),
    ]);

    const { connections, result } = watch({});

    await expect(result).resolves.toBe('ended');
    expect(cursors).toHaveLength(3);
    expect(connections).toEqual(['reconnecting', 'reconnecting', 'open']);
  });

  it('turn_failed 를 받으면 서버가 연결을 닫아도 다시 붙지 않는다', async () => {
    const cursors = scriptStream([
      () =>
        sseResponse({
          events: [{ type: 'turn_failed', turnIndex: 1, reason: 'stream-truncated' }],
          then: 'close',
        }),
    ]);

    await expect(watch({}).result).resolves.toBe('ended');
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(cursors).toHaveLength(1);
  });

  it('403 은 다시 시도하지 않고 forbidden 으로 끝난다', async () => {
    const cursors = scriptStream([
      () => HttpResponse.json({ code: 'SESSION_ACCESS_DENIED' }, { status: 403 }),
    ]);

    await expect(watch({}).result).resolves.toBe('forbidden');
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(cursors).toHaveLength(1);
  });

  it('401 이면 토큰을 갱신해 다시 보낸다', async () => {
    const seen: (string | null)[] = [];
    server.use(
      mswHttp.post(`${CORE_URL}/api/auth/refresh`, () =>
        HttpResponse.json({
          data: {
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
            tokenType: 'Bearer',
            expiresIn: 3600,
          },
        })
      ),
      mswHttp.get(STREAM_URL, ({ request }) => {
        const authorization = request.headers.get('Authorization');
        seen.push(authorization);
        return authorization === 'Bearer access-2'
          ? sseResponse({ events: [sessionCompleted(0)], then: 'close' })
          : HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
      })
    );

    await expect(watch({}).result).resolves.toBe('ended');
    expect(seen).toEqual(['Bearer access-1', 'Bearer access-2']);
  });

  it('갱신해도 401 이면 다시 시도하지 않고 unauthorized 로 끝난다', async () => {
    let calls = 0;
    server.use(
      mswHttp.post(`${CORE_URL}/api/auth/refresh`, () =>
        HttpResponse.json({ code: 'AUTH_401_006', message: '만료' }, { status: 401 })
      ),
      mswHttp.get(STREAM_URL, () => {
        calls += 1;
        return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
      })
    );

    await expect(watch({}).result).resolves.toBe('unauthorized');
    expect(calls).toBe(1);
  });

  it('아무 이벤트 없이 조용한 연결은 끊고 커서부터 다시 구독한다', async () => {
    const cursors = scriptStream([
      () => sseResponse({ events: [completed(0)], then: 'hang' }),
      () => sseResponse({ events: [sessionCompleted(0)], then: 'close' }),
    ]);

    const { result } = watch({ timing: { idleTimeoutMs: 40, retryDelaysMs: [5] } });

    await expect(result).resolves.toBe('ended');
    expect(cursors).toEqual(['-1', '0']);
  });

  it('abort 하면 열려 있던 연결을 끊고 더 요청하지 않는다', async () => {
    const cursors = scriptStream([() => sseResponse({ events: [completed(0)], then: 'hang' })]);
    const controller = new AbortController();

    const { events, result } = watch({ signal: controller.signal });
    await vi.waitFor(() => {
      expect(events).toHaveLength(1);
    });
    controller.abort();

    await expect(result).resolves.toBe('aborted');
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(cursors).toHaveLength(1);
  });

  it('다시 붙기를 기다리는 중에 abort 해도 더 요청하지 않는다', async () => {
    const cursors = scriptStream([() => HttpResponse.json({}, { status: 503 })]);
    const controller = new AbortController();

    const { connections, result } = watch({
      signal: controller.signal,
      timing: { idleTimeoutMs: 400, retryDelaysMs: [10_000] },
    });
    await vi.waitFor(() => {
      expect(connections).toEqual(['reconnecting']);
    });
    controller.abort();

    await expect(result).resolves.toBe('aborted');
    expect(cursors).toHaveLength(1);
  });

  it('계약과 다른 data 는 건너뛰고 나머지를 계속 넘긴다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    server.use(
      mswHttp.get(
        STREAM_URL,
        () =>
          new HttpResponse(
            new ReadableStream<Uint8Array>({
              start(controller) {
                controller.enqueue(encoder.encode('event:delta\ndata:{"type":"delta"}\n\n'));
                controller.enqueue(encoder.encode(':keepalive\n\n'));
                controller.enqueue(frame(sessionCompleted(0)));
                controller.close();
              },
            }),
            { headers: { 'Content-Type': 'text/event-stream' } }
          )
      )
    );

    const { events, result } = watch({});
    await expect(result).resolves.toBe('ended');
    expect(events).toEqual([sessionCompleted(0)]);
  });
});
