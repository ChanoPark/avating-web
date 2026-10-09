import { describe, it, expect } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import { ErrorBoundary } from 'react-error-boundary';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import {
  controlledSessionStream,
  sessionStreamHandler,
  sessionStreamHandlers,
} from '@shared/mocks/handlers/simulationWatch';
import { matchRequestKeys } from '@entities/match-request';
import type { TurnEvent } from '@entities/simulation';
import { isApiError } from '@shared/lib/errors';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { WatchTiming } from '../api/watchTurnStream';
import { SimulationWatch } from '../ui/SimulationWatch';

// hyun_night(내 아바타)가 하늘에게 보내 진행 중인 세션 — 기록은 턴 0~3 이다.
const RUNNING_ID = 'dddddddd-0001-4000-8000-000000000001';
const MINE = 'aaaaaaaa-0002-4000-8000-000000000002';
const PARTNER = '22222222-2222-4222-8222-222222222222';

const FAST: WatchTiming = { idleTimeoutMs: 5_000, retryDelaysMs: [10] };
const ENDED_BAR = '이 대화는 끝났어요';

function renderWatch(options: { timing?: WatchTiming; strictMode?: boolean } = {}) {
  return renderWithProviders(
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div>ROUTE_ERROR {isApiError(error) ? error.statusCode : 'unknown'}</div>
      )}
    >
      <SimulationWatch sessionId={RUNNING_ID} streamTiming={options.timing ?? FAST} />
    </ErrorBoundary>,
    { strictMode: options.strictMode ?? false }
  );
}

function openControlledStream() {
  const stream = controlledSessionStream();
  server.use(stream.handler);
  return stream;
}

async function connected(stream: { cursors: number[] }, connections = 1): Promise<void> {
  await screen.findByRole('log', { name: '대화 기록' });
  await waitFor(() => {
    expect(stream.cursors.length).toBeGreaterThanOrEqual(connections);
  });
}

function messages(): HTMLElement[] {
  return within(screen.getByRole('log', { name: '대화 기록' })).getAllByRole('article');
}

const started = (turnIndex: number, speakerAvatarId: string): TurnEvent => ({
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
const completed = (turnIndex: number, speakerAvatarId: string, content: string): TurnEvent => ({
  type: 'turn_completed',
  turnIndex,
  speakerAvatarId,
  content,
});

describe('SimulationWatch — 실시간', () => {
  it('마지막으로 확정된 턴 다음부터 구독한다', async () => {
    const stream = openControlledStream();
    renderWatch();

    await connected(stream);
    expect(stream.cursors).toEqual([3]);
    expect(messages()).toHaveLength(4);
  });

  it('턴이 시작되면 말할 아바타 자리에 입력 중을 띄우고, 조각이 오는 대로 글자를 붙인다', async () => {
    const stream = openControlledStream();
    renderWatch();
    await connected(stream);

    act(() => {
      stream.push(started(4, MINE));
    });
    await waitFor(() => {
      expect(messages()).toHaveLength(5);
    });
    const live = messages()[4] as HTMLElement;
    expect(within(live).getByText('hyun_night')).toBeInTheDocument();
    expect(live).toHaveClass('self-end');
    expect(within(live).getByText('입력 중')).toBeInTheDocument();
    expect(live.querySelector('time')).toBeNull();

    act(() => {
      stream.push(delta(4, 0, '그런 곳 '), delta(4, 1, '좋아해요'));
    });
    expect(await screen.findByText('그런 곳 좋아해요')).toBeInTheDocument();
    expect(screen.queryByText('입력 중')).not.toBeInTheDocument();
  });

  it('턴이 확정되면 확정본으로 바꾸고 말풍선 옆에 시각을 붙인다', async () => {
    const stream = openControlledStream();
    renderWatch();
    await connected(stream);

    act(() => {
      stream.push(
        started(4, MINE),
        delta(4, 0, '모으던 글자'),
        completed(4, MINE, '확정된 문장이에요.')
      );
    });

    expect(await screen.findByText('확정된 문장이에요.')).toBeInTheDocument();
    expect(screen.queryByText('모으던 글자')).not.toBeInTheDocument();
    expect((messages()[4] as HTMLElement).querySelector('time')).toHaveTextContent(/^\d{2}:\d{2}$/);
  });

  it('턴 도중에 들어와 앞 조각을 못 받았으면 문장 중간부터가 아니라 입력 중만 보이다 전문을 보인다', async () => {
    const stream = openControlledStream();
    renderWatch();
    await connected(stream);

    act(() => {
      stream.push(delta(4, 7, '중간부터 온 조각'));
    });
    await waitFor(() => {
      expect(messages()).toHaveLength(5);
    });
    expect(within(messages()[4] as HTMLElement).getByText('입력 중')).toBeInTheDocument();
    expect(screen.queryByText('중간부터 온 조각')).not.toBeInTheDocument();

    act(() => {
      stream.push(completed(4, PARTNER, '처음부터 끝까지 온 문장'));
    });
    expect(await screen.findByText('처음부터 끝까지 온 문장')).toBeInTheDocument();
    expect(within(messages()[4] as HTMLElement).getByText('하늘')).toBeInTheDocument();
    expect(screen.queryByText('입력 중')).not.toBeInTheDocument();
  });

  it('같은 턴이 두 번 와도 한 번만 그린다', async () => {
    const stream = openControlledStream();
    renderWatch();
    await connected(stream);

    act(() => {
      stream.push(
        completed(4, MINE, '한 번만'),
        completed(4, MINE, '한 번만'),
        completed(3, PARTNER, '겹침')
      );
    });

    expect(await screen.findByText('한 번만')).toBeInTheDocument();
    expect(messages()).toHaveLength(5);
    expect(screen.queryByText('겹침')).not.toBeInTheDocument();
  });

  it('session_completed 가 오면 종료를 알리고 다시 구독하지 않는다', async () => {
    const stream = openControlledStream();
    renderWatch();
    await connected(stream);

    act(() => {
      stream.push(completed(4, MINE, '마지막 턴'), { type: 'session_completed', lastTurnIndex: 4 });
      stream.close();
    });

    expect(await screen.findByText('세션이 종료됐어요')).toBeInTheDocument();
    expect(screen.getByText(ENDED_BAR)).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(stream.cursors).toHaveLength(1);
  });

  it('세션이 끝나면 목록이 새 상태를 받도록 초대 이력을 다시 받는다', async () => {
    server.use(sessionStreamHandler([{ type: 'session_completed', lastTurnIndex: 3 }]));
    const { queryClient } = renderWatch();

    expect(await screen.findByText('세션이 종료됐어요')).toBeInTheDocument();
    await waitFor(() => {
      expect(queryClient.getQueryState(matchRequestKeys.sessions())?.dataUpdateCount).toBe(2);
    });
  });

  it('turn_failed 가 오면 그 턴이 멈췄다고 알리고 대화를 중단으로 닫는다', async () => {
    const stream = openControlledStream();
    renderWatch();
    await connected(stream);

    act(() => {
      stream.push(started(4, MINE), delta(4, 0, '쓰다 만'), {
        type: 'turn_failed',
        turnIndex: 4,
        reason: 'stream-truncated',
      });
      stream.close();
    });

    expect(await screen.findByText('이 턴을 만들지 못해 대화가 멈췄어요')).toBeInTheDocument();
    expect(screen.getByText('세션이 중단됐어요')).toBeInTheDocument();
    expect(screen.getByText(ENDED_BAR)).toBeInTheDocument();
    expect(screen.queryByText('쓰다 만')).not.toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(stream.cursors).toHaveLength(1);
  });

  it('연결이 끊기면 다시 연결 중임을 알리고, 확정된 턴 다음부터 이어 받는다', async () => {
    const stream = openControlledStream();
    renderWatch({ timing: { idleTimeoutMs: 5_000, retryDelaysMs: [200] } });
    await connected(stream);

    act(() => {
      stream.push(completed(4, MINE, '끊기기 전 턴'));
    });
    await screen.findByText('끊기기 전 턴');
    act(() => {
      stream.close();
    });

    expect(await screen.findByRole('status')).toHaveTextContent('연결이 끊겨 다시 연결하고 있어요');
    await connected(stream, 2);
    expect(stream.cursors).toEqual([3, 4]);
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    act(() => {
      stream.push(completed(5, PARTNER, '다시 붙은 뒤 턴'));
    });
    expect(await screen.findByText('다시 붙은 뒤 턴')).toBeInTheDocument();
    expect(messages()).toHaveLength(6);
  });

  it('StrictMode 의 이중 마운트에서도 턴을 한 번만 그린다', async () => {
    const stream = openControlledStream();
    renderWatch({ strictMode: true });
    await connected(stream);
    await new Promise((resolve) => setTimeout(resolve, 30));

    act(() => {
      stream.push(completed(4, MINE, '한 번만 보여야 하는 턴'));
    });

    expect(await screen.findByText('한 번만 보여야 하는 턴')).toBeInTheDocument();
    expect(messages()).toHaveLength(5);
  });

  it('화면을 떠나면 연결을 끊고 다시 구독하지 않는다', async () => {
    const stream = openControlledStream();
    const { unmount } = renderWatch();
    await connected(stream);

    unmount();
    stream.close();
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(stream.cursors).toHaveLength(1);
  });

  it('구독이 403 이면 접근 불가로 올린다', async () => {
    server.use(sessionStreamHandlers.forbidden);
    renderWatch();

    expect(await screen.findByText('ROUTE_ERROR 403')).toBeInTheDocument();
  });

  it('아직 턴이 없는 진행 중 세션은 곧 시작한다고 알린다', async () => {
    const stream = openControlledStream();
    server.use(
      http.get(
        `${import.meta.env.VITE_AI_API_BASE_URL as string}/v1/sessions/:sessionId/turns`,
        () => HttpResponse.json({ sessionId: RUNNING_ID, turns: [], completed: false })
      )
    );
    renderWatch();

    expect(await screen.findByText('대화가 곧 시작돼요')).toBeInTheDocument();
    await connected(stream);
    expect(stream.cursors).toEqual([-1]);
  });
});
