import { describe, it, expect, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from 'react-error-boundary';
import { Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import {
  invitationHistoryHandler,
  invitationHistoryHandlers,
  mockInvitationHistory,
} from '@shared/mocks/handlers/invitationHistory';
import { ownedAvatarsHandlers } from '@shared/mocks/handlers/ownedAvatars';
import {
  controlledSessionStream,
  mockSessionTurns,
  sessionTurnsHandler,
  sessionTurnsHandlers,
} from '@shared/mocks/handlers/simulationWatch';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';
import { useSessionPaneStore } from '@features/simulation-watch';
import { isApiError } from '@shared/lib/errors';
import type { SessionTurns } from '@entities/simulation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SimulationWatchPage } from '../SimulationWatchPage';

const AI_URL = import.meta.env.VITE_AI_API_BASE_URL as string;
const TURNS_URL = `${AI_URL}/v1/sessions/:sessionId/turns`;

// hyunwoo(내 아바타)가 Moonlit 에게 보내 끝난 세션
const DONE_ID = 'dddddddd-0003-4000-8000-000000000003';
// 하늘이 hyunwoo(내 아바타)에게 보내 끝난 세션
const DONE_RECEIVED_ID = 'dddddddd-0004-4000-8000-000000000004';
// Moonlit 이 여름(내 아바타)에게 보냈다가 중단된 세션
const ABORTED_ID = 'dddddddd-0006-4000-8000-000000000006';
// hyun_night(내 아바타)가 하늘에게 보내 진행 중인 세션
const RUNNING_ID = 'dddddddd-0001-4000-8000-000000000001';

const LOADING = '대화를 불러오는 중…';
const ENDED_BAR = '이 대화는 끝났어요';

function turnsOf(sessionId: string): SessionTurns {
  const turns = mockSessionTurns(sessionId);
  if (turns === undefined) throw new Error(`mock 에 없는 세션: ${sessionId}`);
  return turns;
}

function clock(iso: string): string {
  const date = new Date(iso);
  return [date.getHours(), date.getMinutes()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function renderPage(sessionId: string) {
  return renderWithProviders(
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div>ROUTE_ERROR {isApiError(error) ? error.statusCode : 'unknown'}</div>
      )}
    >
      <Routes>
        <Route path="/sim/:sessionId" element={<SimulationWatchPage />} />
      </Routes>
    </ErrorBoundary>,
    { initialRoute: `/sim/${sessionId}` }
  );
}

async function findMessages(): Promise<HTMLElement[]> {
  return within(await screen.findByRole('log', { name: '대화 기록' })).getAllByRole('article');
}

describe('SimulationWatchPage', () => {
  it('불러오는 동안 대화 자리에 스켈레톤을 세운다', () => {
    renderPage(DONE_ID);
    expect(screen.getByText(LOADING)).toBeInTheDocument();
  });

  describe('머리글', () => {
    it('제목에 내 아바타와 상대 아바타를 두 줄로, 각자 이름 바로 뒤에 해시태그를 붙여 보인다', async () => {
      renderPage(DONE_ID);

      const title = await screen.findByRole('heading', { level: 1 });
      expect([...title.children].map((line) => line.textContent)).toEqual([
        'hyunwoo#HW4K7Z',
        'Moonlit#Q5WN8Z',
      ]);
      expect(title).not.toHaveTextContent('×');
    });

    it('받은 요청으로 시작한 세션도 내 아바타를 윗줄에 둔다', async () => {
      renderPage(ABORTED_ID);

      const title = await screen.findByRole('heading', { level: 1 });
      expect([...title.children].map((line) => line.textContent)).toEqual([
        '여름#YR5T8K',
        'Moonlit#Q5WN8Z',
      ]);
    });

    it('응답에 해시태그가 없으면 이름만 두 줄로 보인다', async () => {
      server.use(
        invitationHistoryHandler(
          mockInvitationHistory.map(
            ({ inviterAvatarHashtag: _a, inviteeAvatarHashtag: _b, ...rest }) => rest
          )
        )
      );
      renderPage(DONE_ID);

      const title = await screen.findByRole('heading', { level: 1 });
      expect([...title.children].map((line) => line.textContent)).toEqual(['hyunwoo', 'Moonlit']);
    });

    it('긴 이름은 자리가 모자란 만큼만 말줄임하고, 해시태그는 줄어들지 않는다', async () => {
      renderPage(DONE_ID);

      const title = await screen.findByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-lead', 'font-bold');
      for (const line of title.children) {
        expect(line).toHaveClass('min-w-0');
        expect(line.children[0]).toHaveClass('truncate');
        expect(line.children[1]).toHaveClass('shrink-0');
      }
    });

    it('머리글에 턴 수를 쓰지 않는다', async () => {
      renderPage(DONE_ID);

      await findMessages();
      expect(screen.queryByText(/\d+턴/)).not.toBeInTheDocument();
    });

    it('상단 경로에는 대화를 따로 올리지 않는다', async () => {
      renderPage(DONE_ID);

      await findMessages();
      expect(useChromeBreadcrumbStore.getState().trail).toBeNull();
    });

    it('연 대화를 기억해 둔다 — 채팅 탭이 여기로 돌아온다', async () => {
      renderPage(DONE_ID);

      await findMessages();
      expect(useSessionPaneStore.getState().lastSessionId).toBe(DONE_ID);
      useSessionPaneStore.setState(useSessionPaneStore.getInitialState(), true);
    });
  });

  describe('대화 기록', () => {
    it('확정된 턴을 순서대로 모두 보인다', async () => {
      renderPage(DONE_ID);

      const messages = await findMessages();
      const { turns } = turnsOf(DONE_ID);
      expect(messages).toHaveLength(turns.length);
      messages.forEach((message, i) => {
        expect(within(message).getByText(turns[i]?.content ?? '')).toBeInTheDocument();
      });
    });

    it('응답이 턴을 뒤섞어 줘도 턴 번호 순으로 보인다', async () => {
      const { turns, ...rest } = turnsOf(DONE_ID);
      server.use(sessionTurnsHandler({ ...rest, turns: [...turns].reverse() }));
      renderPage(DONE_ID);

      const messages = await findMessages();
      expect(within(messages[0] as HTMLElement).getByText(turns[0]?.content ?? '')).toBeVisible();
    });

    it('발화마다 말한 아바타의 이름을 보이고, "내 아바타" 라는 글자는 붙이지 않는다', async () => {
      renderPage(DONE_ID);

      const [first, second] = (await findMessages()) as [HTMLElement, HTMLElement];

      expect(within(first).getByText('hyunwoo')).toBeInTheDocument();
      expect(within(second).getByText('Moonlit')).toBeInTheDocument();
      expect(screen.getByRole('log', { name: '대화 기록' })).not.toHaveTextContent('내 아바타');
    });

    it('받은 요청으로 시작한 세션은 초대받은 쪽이 내 아바타라 그쪽 말풍선이 오른쪽이다', async () => {
      renderPage(ABORTED_ID);

      const [first, second] = (await findMessages()) as [HTMLElement, HTMLElement];
      expect(within(first).getByText('Moonlit')).toBeInTheDocument();
      expect(first).not.toHaveClass('self-end');
      expect(within(second).getByText('여름')).toBeInTheDocument();
      expect(second).toHaveClass('self-end');
    });

    it('내 아바타의 말풍선은 오른쪽에, 상대 아바타의 말풍선은 왼쪽에 둔다', async () => {
      renderPage(DONE_ID);

      const [mine, partner] = (await findMessages()) as [HTMLElement, HTMLElement];
      expect(mine).toHaveClass('self-end', 'items-end');
      expect(mine.querySelector('p')?.parentElement).toHaveClass('flex-row-reverse');
      expect(mine.querySelector('p')).toHaveClass('rounded-tr-chip');
      expect(partner).not.toHaveClass('self-end');
      expect(partner.querySelector('p')?.parentElement).not.toHaveClass('flex-row-reverse');
      expect(partner.querySelector('p')).toHaveClass('rounded-tl-chip');
    });

    it('턴 구분선을 두지 않고, 말풍선 옆에 발화 시각을 쓴다', async () => {
      renderPage(DONE_ID);

      const messages = await findMessages();
      const { turns } = turnsOf(DONE_ID);
      expect(screen.getByRole('log', { name: '대화 기록' })).not.toHaveTextContent(/TURN/);
      messages.forEach((message, i) => {
        const bubble = message.querySelector('p');
        const time = message.querySelector('time');
        expect(time).toHaveTextContent(clock(turns[i]?.createdAt ?? ''));
        expect(time).toHaveAttribute('datetime', turns[i]?.createdAt);
        expect(time?.parentElement).toBe(bubble?.parentElement);
      });
    });

    it('아바타 얼굴은 이름 줄이 아니라 말풍선 옆에 둔다', async () => {
      renderPage(DONE_ID);

      const [first] = (await findMessages()) as [HTMLElement];
      const bubble = first.querySelector('p');
      const face = first.querySelector('[aria-hidden="true"]');
      expect(face?.parentElement).toBe(bubble?.parentElement);
      expect(within(first).getByText('hyunwoo').parentElement).not.toBe(bubble?.parentElement);
    });

    it('말한 아바타의 얼굴은 응답이 준 각자의 색을 입는다', async () => {
      server.use(ownedAvatarsHandlers.serverError);
      renderPage(DONE_ID);

      const [first, second] = (await findMessages()) as [HTMLElement, HTMLElement];
      expect(first.querySelector('[aria-hidden="true"]')).toHaveClass('bg-id-sky');
      expect(second.querySelector('[aria-hidden="true"]')).toHaveClass('bg-id-violet');
    });

    it('응답에 색이 없으면 내 아바타 얼굴은 내 아바타 목록의 색을 입는다', async () => {
      server.use(
        invitationHistoryHandler(
          mockInvitationHistory.map(
            ({ inviterAvatarColor: _a, inviteeAvatarColor: _b, ...rest }) => rest
          )
        )
      );
      renderPage(DONE_ID);

      const [first, second] = (await findMessages()) as [HTMLElement, HTMLElement];
      await waitFor(() => {
        expect(first.querySelector('[aria-hidden="true"]')).toHaveClass('bg-id-sky');
      });
      expect(second.querySelector('[aria-hidden="true"]')).toHaveClass('bg-id-none');
    });

    it('턴이 적어 화면이 남으면 대화를 아래쪽에 붙인다', async () => {
      renderPage(ABORTED_ID);

      await findMessages();
      const log = screen.getByRole('log', { name: '대화 기록' });
      expect(log.children).toHaveLength(1);
      expect(log.firstElementChild).toHaveClass('mt-auto');
    });

    it('나눈 대화가 없는 세션은 그렇다고 알린다', async () => {
      server.use(sessionTurnsHandler({ sessionId: DONE_ID, turns: [], completed: true }));
      renderPage(DONE_ID);

      expect(await screen.findByText('나눈 대화가 없어요')).toBeInTheDocument();
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });
  });

  describe('왼쪽 시뮬레이션 목록', () => {
    const PANE = '시뮬레이션 목록';

    it('대화 왼쪽에 들어갈 수 있는 세션을 진행 중인 것부터 최근 순으로 늘어놓는다', async () => {
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      await within(pane).findAllByRole('link');
      expect(
        within(pane)
          .getAllByRole('link')
          .map((link) => link.getAttribute('href'))
      ).toEqual([
        `/sim/${RUNNING_ID}`,
        `/sim/${DONE_ID}`,
        `/sim/${DONE_RECEIVED_ID}`,
        `/sim/${ABORTED_ID}`,
      ]);
    });

    it('행에 내 아바타와 상대 아바타를 두 줄로, 각자 이름 바로 뒤에 해시태그를 붙여 보인다', async () => {
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      const [running, , , aborted] = (await within(pane).findAllByRole('link')) as [
        HTMLElement,
        HTMLElement,
        HTMLElement,
        HTMLElement,
      ];
      expect(within(running).getByText('hyun_night').parentElement).toHaveTextContent(
        /^hyun_night#HN8R2Q$/
      );
      expect(within(running).getByText('하늘').parentElement).toHaveTextContent(/^하늘#H7K2MP$/);
      expect(within(running).getByText('hyun_night')).toHaveClass('truncate');
      expect(within(running).getByText('#HN8R2Q')).toHaveClass('shrink-0');
      expect(running).not.toHaveTextContent('×');
      expect(within(aborted).getByText('여름')).toBeInTheDocument();
      expect(within(aborted).getByText('Moonlit')).toBeInTheDocument();
    });

    it('상태는 글자 없이 동그라미 색으로만 보인다 — 진행 중 파랑, 중단 주황, 종료 회색', async () => {
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      const [running, done, , aborted] = (await within(pane).findAllByRole('link')) as [
        HTMLElement,
        HTMLElement,
        HTMLElement,
        HTMLElement,
      ];
      expect(within(running).getByRole('img', { name: '진행 중' })).toHaveClass('bg-id-blue');
      expect(within(done).getByRole('img', { name: '종료' })).toHaveClass('bg-id-none');
      expect(within(aborted).getByRole('img', { name: '중단' })).toHaveClass('bg-id-orange');
      expect(pane).not.toHaveTextContent(/진행 중|종료|중단/);
    });

    it('오른쪽의 요청 시각은 줄바꿈하지 않는다', async () => {
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      const [running] = (await within(pane).findAllByRole('link')) as [HTMLElement];
      expect(running.querySelector('time')).toHaveClass('shrink-0', 'whitespace-nowrap');
      expect(running.querySelector('time')).toHaveTextContent(/^40분 전$/);
    });

    it('지금 보고 있는 세션만 현재 위치로 표시한다', async () => {
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      const links = await within(pane).findAllByRole('link');
      expect(links.filter((link) => link.getAttribute('aria-current') === 'page')).toEqual([
        links[1],
      ]);
    });

    it('다른 행을 누르면 그 세션의 대화로 바뀐다', async () => {
      const user = userEvent.setup();
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      await user.click(await within(pane).findByRole('link', { name: /여름.*Moonlit/ }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('여름');
      });
      expect(screen.getByText('세션이 중단됐어요')).toBeInTheDocument();
      expect(await findMessages()).toHaveLength(turnsOf(ABORTED_ID).turns.length);
    });

    it('한 세션의 대화를 못 받은 뒤에도 목록에서 다른 세션을 누르면 그 대화가 보인다', async () => {
      const user = userEvent.setup();
      server.use(
        http.get(TURNS_URL, ({ params }) =>
          params.sessionId === ABORTED_ID
            ? HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })
            : HttpResponse.json(turnsOf(String(params.sessionId)))
        )
      );
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      await user.click(await within(pane).findByRole('link', { name: /여름.*Moonlit/ }));
      expect(await screen.findByText('대화를 불러오지 못했어요')).toBeInTheDocument();

      await user.click(within(pane).getByRole('link', { name: /hyunwoo.*Moonlit/ }));

      expect(await findMessages()).toHaveLength(turnsOf(DONE_ID).turns.length);
    });

    it('한 번 실패했던 세션을 목록에서 다시 누르면 대화를 다시 받아 보인다', async () => {
      const user = userEvent.setup();
      let abortedCalls = 0;
      server.use(
        http.get(TURNS_URL, ({ params }) => {
          if (params.sessionId !== ABORTED_ID) {
            return HttpResponse.json(turnsOf(String(params.sessionId)));
          }
          abortedCalls += 1;
          return abortedCalls === 1
            ? HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })
            : HttpResponse.json(turnsOf(ABORTED_ID));
        })
      );
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      await user.click(await within(pane).findByRole('link', { name: /여름.*Moonlit/ }));
      await screen.findByText('대화를 불러오지 못했어요');
      await user.click(within(pane).getByRole('link', { name: /hyunwoo.*Moonlit/ }));
      await findMessages();

      await user.click(within(pane).getByRole('link', { name: /여름.*Moonlit/ }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('여름');
      });
      expect(await findMessages()).toHaveLength(turnsOf(ABORTED_ID).turns.length);
      expect(abortedCalls).toBe(2);
    });

    it('응답에 simulationId 가 없어 들어갈 수 없는 세션은 목록에 넣지 않는다', async () => {
      server.use(
        invitationHistoryHandler(
          mockInvitationHistory.map((item) => {
            if (item.simulationId === DONE_ID) return item;
            const { simulationId: _simulationId, ...rest } = item;
            return rest;
          })
        )
      );
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      expect(await within(pane).findAllByRole('link')).toHaveLength(1);
    });

    describe('접기', () => {
      const COLLAPSE = '시뮬레이션 목록 접기';
      const EXPAND = '시뮬레이션 목록 펼치기';

      afterEach(() => {
        useSessionPaneStore.setState(useSessionPaneStore.getInitialState(), true);
      });

      it('목록 아래의 버튼으로 접으면 행이 사라지고 펼치는 화살표 버튼만 남는다', async () => {
        const user = userEvent.setup();
        renderPage(DONE_ID);

        const pane = await screen.findByRole('navigation', { name: PANE });
        await within(pane).findAllByRole('link');
        const collapse = within(pane).getByRole('button', { name: COLLAPSE });
        expect(collapse).toHaveAttribute('aria-expanded', 'true');

        await user.click(collapse);

        expect(within(pane).queryByRole('link')).not.toBeInTheDocument();
        expect(within(pane).getAllByRole('button')).toHaveLength(1);
        expect(within(pane).getByRole('button', { name: EXPAND })).toHaveAttribute(
          'aria-expanded',
          'false'
        );
        expect(pane).toHaveClass('w-12');
        expect(pane).not.toHaveClass('w-70');
      });

      it('접힌 상태에서 화살표 버튼을 누르면 다시 펼친다', async () => {
        const user = userEvent.setup();
        renderPage(DONE_ID);

        const pane = await screen.findByRole('navigation', { name: PANE });
        await user.click(await within(pane).findByRole('button', { name: COLLAPSE }));
        await user.click(within(pane).getByRole('button', { name: EXPAND }));

        expect(await within(pane).findAllByRole('link')).toHaveLength(4);
        expect(pane).toHaveClass('w-70');
      });

      it('접어 둔 채로 다른 세션에 들어가도 접힌 채다', async () => {
        const user = userEvent.setup();
        const first = renderPage(DONE_ID);
        const pane = await screen.findByRole('navigation', { name: PANE });
        await user.click(await within(pane).findByRole('button', { name: COLLAPSE }));
        first.unmount();

        renderPage(ABORTED_ID);

        const reopened = await screen.findByRole('navigation', { name: PANE });
        expect(within(reopened).getByRole('button', { name: EXPAND })).toBeInTheDocument();
        expect(within(reopened).queryByRole('link')).not.toBeInTheDocument();
      });
    });

    it('목록 폭은 280 이고, 좁은 화면에서는 목록을 접고 대화만 보인다', async () => {
      renderPage(DONE_ID);

      const pane = await screen.findByRole('navigation', { name: PANE });
      expect(pane).toHaveClass('w-70', 'hidden', 'lg:flex');
      expect(pane.className).not.toMatch(/2xl:w-/);
    });
  });

  describe('세션 상태', () => {
    it('끝난 세션은 대화 끝에 종료를 알리고 아래에 종료 바를 둔다', async () => {
      renderPage(DONE_ID);

      await findMessages();
      expect(screen.getByText('세션이 종료됐어요')).toBeInTheDocument();
      expect(screen.getByText(ENDED_BAR)).toBeInTheDocument();
    });

    it('중단된 세션은 중단됐다고 알린다', async () => {
      renderPage(ABORTED_ID);

      await findMessages();
      expect(screen.getByText('세션이 중단됐어요')).toBeInTheDocument();
      expect(screen.getByText(ENDED_BAR)).toBeInTheDocument();
    });

    it('진행 중인 세션은 종료 안내 없이 지금까지의 턴을 보이고 실시간 구독을 연다', async () => {
      const stream = controlledSessionStream();
      server.use(stream.handler);
      renderPage(RUNNING_ID);

      expect(await findMessages()).toHaveLength(4);
      expect(screen.queryByText('세션이 종료됐어요')).not.toBeInTheDocument();
      expect(screen.queryByText(ENDED_BAR)).not.toBeInTheDocument();
      await waitFor(() => {
        expect(stream.cursors).toEqual([3]);
      });
    });

    it('끝난 세션은 실시간 구독을 열지 않는다', async () => {
      const stream = controlledSessionStream();
      server.use(stream.handler);
      renderPage(DONE_ID);

      await findMessages();
      expect(stream.cursors).toEqual([]);
    });

    it('목록은 진행 중이라 해도 대화 응답이 completed 면 끝난 것으로 보고 구독하지 않는다', async () => {
      const stream = controlledSessionStream();
      server.use(sessionTurnsHandler({ ...turnsOf(RUNNING_ID), completed: true }), stream.handler);
      renderPage(RUNNING_ID);

      await findMessages();
      expect(screen.getByText('세션이 종료됐어요')).toBeInTheDocument();
      expect(screen.getByText(ENDED_BAR)).toBeInTheDocument();
      expect(stream.cursors).toEqual([]);
    });
  });

  describe('열 수 없는 세션', () => {
    it('참가자가 아닌 세션(403)은 라우트 경계로 올려 접근 불가 화면을 띄우게 한다', async () => {
      server.use(sessionTurnsHandlers.forbidden);
      renderPage(DONE_ID);

      expect(await screen.findByText('ROUTE_ERROR 403')).toBeInTheDocument();
    });

    it('내 초대 이력에 없는 세션은 대화를 요청하지 않고 없는 화면(404)으로 올린다', async () => {
      let requested = false;
      server.use(
        http.get(TURNS_URL, () => {
          requested = true;
          return HttpResponse.json({ code: 'SESSION_NOT_FOUND' }, { status: 404 });
        })
      );
      renderPage('eeeeeeee-0000-4000-8000-000000000000');

      expect(await screen.findByText('ROUTE_ERROR 404')).toBeInTheDocument();
      expect(requested).toBe(false);
    });

    it('끝난 세션의 대화가 서버에 없으면(404) 기다리지 않고 없는 화면으로 올린다', async () => {
      let calls = 0;
      server.use(
        http.get(TURNS_URL, () => {
          calls += 1;
          return HttpResponse.json({ code: 'SESSION_NOT_FOUND' }, { status: 404 });
        })
      );
      renderPage(DONE_ID);

      expect(await screen.findByText('ROUTE_ERROR 404')).toBeInTheDocument();
      expect(calls).toBe(1);
    });

    it('막 수락돼 아직 등록 전인 세션(404)은 다시 물어 대화를 보인다', async () => {
      let calls = 0;
      server.use(
        http.get(TURNS_URL, () => {
          calls += 1;
          return calls === 1
            ? HttpResponse.json({ code: 'SESSION_NOT_FOUND' }, { status: 404 })
            : HttpResponse.json(turnsOf(RUNNING_ID));
        }),
        controlledSessionStream().handler
      );
      renderPage(RUNNING_ID);

      const log = await screen.findByRole('log', { name: '대화 기록' }, { timeout: 3_000 });
      expect(within(log).getAllByRole('article')).toHaveLength(4);
      expect(calls).toBe(2);
    });
  });

  describe('불러오기 실패', () => {
    it('대화를 못 받으면 상단 토스트로 알리고 화면을 비워 둔다', async () => {
      server.use(sessionTurnsHandlers.serverError);
      renderPage(DONE_ID);

      expect(await screen.findByText('대화를 불러오지 못했어요')).toBeInTheDocument();
      expect(screen.queryByText(LOADING)).not.toBeInTheDocument();
      expect(screen.queryByRole('log')).not.toBeInTheDocument();
      expect(screen.queryByText(/ROUTE_ERROR/)).not.toBeInTheDocument();
    });

    it('초대 이력을 못 받아도 같은 토스트로 알린다', async () => {
      server.use(invitationHistoryHandlers.serverError);
      renderPage(DONE_ID);

      expect(await screen.findByText('대화를 불러오지 못했어요')).toBeInTheDocument();
      expect(screen.queryByText(/ROUTE_ERROR/)).not.toBeInTheDocument();
    });
  });
});
