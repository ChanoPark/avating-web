import { aiFetch } from '@shared/api/aiFetch';
import { readSseFrames } from '@shared/api/sse';
import { parseTurnEvent, type TurnEvent } from '@entities/simulation';

export type StreamConnection = 'open' | 'reconnecting';

export type StreamOutcome = 'ended' | 'aborted' | 'forbidden' | 'unauthorized';

export type WatchTiming = {
  /** 서버가 FIN 없이 죽으면 에러도 이벤트도 오지 않는다 — 이만큼 조용하면 끊고 다시 붙는다. */
  idleTimeoutMs: number;
  /** n 번째 연속 실패 뒤 기다릴 시간. 끝을 넘으면 마지막 값을 계속 쓴다. */
  retryDelaysMs: readonly number[];
};

const DEFAULT_TIMING: WatchTiming = {
  idleTimeoutMs: 60_000,
  retryDelaysMs: [1_000, 2_000, 4_000, 8_000, 10_000],
};

type WatchTurnStreamOptions = {
  sessionId: string;
  /** 이미 확정된 마지막 턴. 서버가 그 뒤 확정 턴을 다시 채워 주므로 다시 붙을 때 누락이 없다. */
  afterTurnIndex: number;
  onEvent: (event: TurnEvent) => void;
  onConnectionChange: (connection: StreamConnection) => void;
  signal: AbortSignal;
  timing?: WatchTiming;
};

type AttemptOutcome = StreamOutcome | 'retry';

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done);
  });
}

function isTerminal(event: TurnEvent): boolean {
  return event.type === 'session_completed' || event.type === 'turn_failed';
}

export async function watchTurnStream({
  sessionId,
  afterTurnIndex,
  onEvent,
  onConnectionChange,
  signal,
  timing = DEFAULT_TIMING,
}: WatchTurnStreamOptions): Promise<StreamOutcome> {
  let cursor = afterTurnIndex;
  let failures = 0;

  async function attempt(): Promise<AttemptOutcome> {
    const connection = new AbortController();
    const abortConnection = () => {
      connection.abort();
    };
    signal.addEventListener('abort', abortConnection);
    let idleTimer = setTimeout(abortConnection, timing.idleTimeoutMs);

    try {
      const response = await aiFetch(
        `/v1/sessions/${encodeURIComponent(sessionId)}/stream?afterTurnIndex=${String(cursor)}`,
        { accept: 'text/event-stream', signal: connection.signal }
      );
      if (response.status === 403) return 'forbidden';
      if (response.status === 401) return 'unauthorized';
      if (!response.ok || response.body === null) return 'retry';

      onConnectionChange('open');
      failures = 0;

      for await (const frame of readSseFrames(response.body, connection.signal)) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(abortConnection, timing.idleTimeoutMs);

        const event = parseTurnEvent(frame.data);
        if (event === null) continue;
        if (event.type === 'turn_completed') cursor = Math.max(cursor, event.turnIndex);
        onEvent(event);
        if (isTerminal(event)) return 'ended';
      }
      return 'retry';
    } catch {
      return 'retry';
    } finally {
      clearTimeout(idleTimer);
      signal.removeEventListener('abort', abortConnection);
      connection.abort();
    }
  }

  const isAborted = () => signal.aborted;

  while (!isAborted()) {
    const outcome = await attempt();
    if (isAborted()) break;
    if (outcome !== 'retry') return outcome;

    onConnectionChange('reconnecting');
    const delay = timing.retryDelaysMs[Math.min(failures, timing.retryDelaysMs.length - 1)] ?? 0;
    failures += 1;
    await wait(delay, signal);
  }
  return 'aborted';
}
