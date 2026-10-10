import { http, HttpResponse } from 'msw';
import type { InvitationHistoryItem } from '@entities/match-request';
import type { SessionTurns, TurnEvent } from '@entities/simulation';
import { mockInvitationHistory } from './invitationHistory';

const BASE_URL = import.meta.env.VITE_AI_API_BASE_URL as string;
const TURNS_URL = `${BASE_URL}/v1/sessions/:sessionId/turns`;
const STREAM_URL = `${BASE_URL}/v1/sessions/:sessionId/stream`;

const MINUTE = 60_000;

const SCRIPT = [
  '안녕하세요. 프로필에 적어 두신 서촌 산책 이야기가 눈에 들어왔어요.',
  '반가워요. 주말마다 통의동에서 시작해서 책방까지 걷는 편이에요.',
  '자주 가는 책방이 있어요? 저는 통인시장 쪽까지 걷다가 들르는 곳이 하나 있어요.',
  '독립서점 한 곳을 정해 두고 가요. 사장님이 골라 둔 책을 한 권씩 사 오는 게 낙이에요.',
  '그런 곳 좋아해요. 최근에 사 온 책 중에 기억에 남는 게 있어요?',
  '여행 산문집이요. 읽다 보니 걷고 싶어져서 그날 저녁에 한 번 더 나갔어요.',
  '저도 그 책 궁금해졌어요. 다음에 그 책방 이야기 더 들려주세요.',
  '좋아요. 목요일 저녁에 여는 곳이라, 그때 맞춰 가면 한적해요.',
];

const TURN_COUNT: Partial<Record<InvitationHistoryItem['status'], number>> = {
  DONE: SCRIPT.length,
  ABORTED: 3,
  IN_PROGRESS: 4,
};

function sessionTurns(invitation: InvitationHistoryItem, sessionId: string): SessionTurns {
  const startedAt = Date.parse(invitation.createdAt) + MINUTE;
  return {
    sessionId,
    turns: SCRIPT.slice(0, TURN_COUNT[invitation.status] ?? 0).map((content, index) => ({
      index,
      speakerAvatarId: index % 2 === 0 ? invitation.inviterAvatarId : invitation.inviteeAvatarId,
      content,
      createdAt: new Date(startedAt + index * MINUTE).toISOString(),
    })),
    completed: invitation.status === 'DONE',
  };
}

export function mockSessionTurns(sessionId: string): SessionTurns | undefined {
  const invitation = mockInvitationHistory.find((item) => item.simulationId === sessionId);
  return invitation === undefined ? undefined : sessionTurns(invitation, sessionId);
}

function notFound() {
  return HttpResponse.json({ code: 'SESSION_NOT_FOUND' }, { status: 404 });
}

export function sessionTurnsHandler(body: SessionTurns) {
  return http.get(TURNS_URL, () => HttpResponse.json(body));
}

export const sessionTurnsHandlers = {
  success: http.get(TURNS_URL, ({ params }) => {
    const body = mockSessionTurns(String(params.sessionId));
    return body === undefined ? notFound() : HttpResponse.json(body);
  }),

  forbidden: http.get(TURNS_URL, () =>
    HttpResponse.json({ code: 'SESSION_ACCESS_DENIED' }, { status: 403 })
  ),

  notFound: http.get(TURNS_URL, notFound),

  serverError: http.get(TURNS_URL, () =>
    HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })
  ),
};

const PACE =
  import.meta.env.MODE === 'test' ? { deltaMs: 0, turnMs: 0 } : { deltaMs: 60, turnMs: 900 };
const DELTA_LENGTH = 3;

type StreamStep = { event: TurnEvent; waitMs: number };

const encoder = new TextEncoder();

function sseFrame(event: TurnEvent): Uint8Array {
  return encoder.encode(`event:${event.type}\ndata:${JSON.stringify(event)}\n\n`);
}

function sseResponse(start: (controller: ReadableStreamDefaultController<Uint8Array>) => void) {
  return new HttpResponse(new ReadableStream<Uint8Array>({ start }), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function turnSteps(turnIndex: number, speakerAvatarId: string, content: string): StreamStep[] {
  const pieces = content.match(new RegExp(`[\\s\\S]{1,${String(DELTA_LENGTH)}}`, 'g')) ?? [];
  return [
    { event: { type: 'turn_started', turnIndex, speakerAvatarId }, waitMs: PACE.turnMs },
    ...pieces.map((text, seq) => ({
      event: { type: 'delta' as const, turnIndex, seq, text },
      waitMs: PACE.deltaMs,
    })),
    {
      event: { type: 'turn_completed', turnIndex, speakerAvatarId, content },
      waitMs: PACE.deltaMs,
    },
  ];
}

function liveSteps(invitation: InvitationHistoryItem, afterTurnIndex: number): StreamStep[] {
  const lastTurnIndex = SCRIPT.length - 1;
  const from = Math.max(afterTurnIndex + 1, TURN_COUNT[invitation.status] ?? 0);
  return [
    ...SCRIPT.flatMap((content, index) =>
      index < from
        ? []
        : turnSteps(
            index,
            index % 2 === 0 ? invitation.inviterAvatarId : invitation.inviteeAvatarId,
            content
          )
    ),
    { event: { type: 'session_completed', lastTurnIndex }, waitMs: PACE.turnMs },
  ];
}

function pacedResponse(steps: StreamStep[], signal: AbortSignal) {
  return sseResponse((controller) => {
    void (async () => {
      for (const { event, waitMs } of steps) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        if (signal.aborted) return;
        controller.enqueue(sseFrame(event));
      }
      controller.close();
    })();
  });
}

export function sessionStreamHandler(events: TurnEvent[], then: 'close' | 'hang' = 'close') {
  return http.get(STREAM_URL, () =>
    sseResponse((controller) => {
      for (const event of events) controller.enqueue(sseFrame(event));
      if (then === 'close') controller.close();
    })
  );
}

export function controlledSessionStream() {
  const cursors: number[] = [];
  let current: ReadableStreamDefaultController<Uint8Array> | undefined;

  return {
    cursors,
    handler: http.get(STREAM_URL, ({ request }) => {
      cursors.push(Number(new URL(request.url).searchParams.get('afterTurnIndex')));
      return sseResponse((controller) => {
        current = controller;
      });
    }),
    push(...events: TurnEvent[]): void {
      for (const event of events) current?.enqueue(sseFrame(event));
    },
    close(): void {
      current?.close();
      current = undefined;
    },
  };
}

export const sessionStreamHandlers = {
  live: http.get(STREAM_URL, ({ params, request }) => {
    const invitation = mockInvitationHistory.find(
      (item) => item.simulationId === String(params.sessionId)
    );
    if (invitation === undefined) return notFound();
    const afterTurnIndex = Number(new URL(request.url).searchParams.get('afterTurnIndex') ?? -1);
    return pacedResponse(liveSteps(invitation, afterTurnIndex), request.signal);
  }),

  forbidden: http.get(STREAM_URL, () =>
    HttpResponse.json({ code: 'SESSION_ACCESS_DENIED' }, { status: 403 })
  ),
};

export const simulationWatchDefaultHandlers = [
  sessionTurnsHandlers.success,
  sessionStreamHandlers.live,
];
