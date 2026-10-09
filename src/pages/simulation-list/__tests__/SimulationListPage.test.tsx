import { describe, it, expect, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { delay, http, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import {
  invitationAcceptHandlers,
  invitationCancelHandlers,
  invitationHistoryHandler,
  invitationHistoryHandlers,
  mockInvitationHistory,
  resetInvitationHistory,
} from '@shared/mocks/handlers/invitationHistory';
import { ownedAvatarsHandlers } from '@shared/mocks/handlers/ownedAvatars';
import { avatarKeys } from '@entities/avatar';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SimulationListPage } from '../SimulationListPage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const RUNNING = '진행 중인 시뮬레이션';
const REQUESTS = '요청 내역';
const ACCEPT = 'Moonlit의 요청 수락';
const CANCEL = '봄날에게 보낸 요청 취소';

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/simulations" element={<SimulationListPage />} />
      <Route path="/explore" element={<div>EXPLORE</div>} />
      <Route path="/avatars/:id" element={<div>AVATAR_DETAIL</div>} />
    </Routes>,
    { initialRoute: '/simulations' }
  );
}

async function findRows(tableName: string): Promise<HTMLElement[]> {
  const table = await screen.findByRole('table', { name: tableName });
  return within(table).getAllByRole('row').slice(1);
}

function cellsOf(row: HTMLElement | undefined): HTMLElement[] {
  return within(row as HTMLElement).getAllByRole('cell');
}

afterEach(() => {
  resetInvitationHistory();
  server.events.removeAllListeners('request:start');
});

describe('SimulationListPage', () => {
  it('페이지 제목을 h1 으로 보인다', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: '매칭 요청' })).toBeInTheDocument();
  });

  it('불러오는 동안 목록 자리에 스켈레톤을 세운다', () => {
    renderPage();
    expect(screen.getByText('시뮬레이션 목록을 불러오는 중…')).toBeInTheDocument();
  });

  describe('표 구성', () => {
    it('진행 중인 시뮬레이션을 위에, 요청 내역을 아래에 따로 보인다', async () => {
      renderPage();

      await screen.findByRole('table', { name: RUNNING });
      expect(
        screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
      ).toEqual([RUNNING, REQUESTS]);
    });

    it('두 표 모두 내 아바타 · 상대 아바타 · 구분 · 상태 · 요청 시각 · 비고 컬럼을 둔다', async () => {
      renderPage();

      for (const name of [RUNNING, REQUESTS]) {
        const table = await screen.findByRole('table', { name });
        expect(
          within(table)
            .getAllByRole('columnheader')
            .map((header) => header.textContent)
        ).toEqual(['내 아바타', '상대 아바타', '구분', '상태', '요청 시각', '비고']);
      }
    });

    it('머리글과 칸 내용은 아바타 칸까지 모두 가운데 정렬이다', async () => {
      renderPage();

      const table = await screen.findByRole('table', { name: RUNNING });
      for (const cell of [
        ...within(table).getAllByRole('columnheader'),
        ...within(table).getAllByRole('cell'),
      ]) {
        expect(cell).toHaveClass('text-center');
      }
    });

    it('아바타 칸은 같은 폭의 묶음을 가운데에 두어 이름 길이와 상관없이 타일이 한 줄로 선다', async () => {
      renderPage();

      const rows = await findRows(REQUESTS);
      for (const row of rows) {
        for (const cell of cellsOf(row).slice(0, 2)) {
          expect(cell.firstElementChild).toHaveClass('mx-auto', 'w-full', 'max-w-60', 'text-left');
          expect(cell.firstElementChild).not.toHaveClass('justify-center');
        }
      }
    });

    it('진행 중인 것이 없으면 위 표를 두지 않는다', async () => {
      server.use(
        invitationHistoryHandler(
          mockInvitationHistory.filter((item) => item.status !== 'IN_PROGRESS')
        )
      );
      renderPage();

      await screen.findByRole('table', { name: REQUESTS });
      expect(screen.queryByRole('table', { name: RUNNING })).not.toBeInTheDocument();
    });
  });

  describe('진행 중인 시뮬레이션', () => {
    it('행에 내 아바타와 상대 아바타를 칸을 나눠 해시태그와 함께 보인다', async () => {
      renderPage();

      const [row] = await findRows(RUNNING);
      const cells = cellsOf(row);
      expect(within(cells[0] as HTMLElement).getByText('hyun_night')).toBeInTheDocument();
      expect(within(cells[0] as HTMLElement).getByText('#HN8R2Q')).toBeInTheDocument();
      expect(within(cells[0] as HTMLElement).queryByRole('link')).not.toBeInTheDocument();
      expect(
        within(cells[1] as HTMLElement).getByRole('link', { name: '하늘' })
      ).toBeInTheDocument();
      expect(within(cells[1] as HTMLElement).getByText('#H7K2MP')).toBeInTheDocument();
      expect(cells[2]).toHaveTextContent('보낸 요청');
      expect(cells[3]).toHaveTextContent('진행 중');
      expect(cells[4]?.querySelector('time')).toHaveAttribute(
        'datetime',
        mockInvitationHistory.find((item) => item.status === 'IN_PROGRESS')?.createdAt
      );
    });

    it('내 아바타 · 상대 아바타 타일은 응답이 준 각자의 색을 입는다', async () => {
      server.use(ownedAvatarsHandlers.serverError);
      renderPage();

      const [row] = await findRows(RUNNING);
      const cells = cellsOf(row);
      expect(cells[0]?.querySelector('[aria-hidden="true"]')).toHaveClass('bg-id-pink');
      expect(cells[1]?.querySelector('[aria-hidden="true"]')).toHaveClass('bg-id-sky');
    });

    it('응답의 색이 내 아바타 목록의 색보다 먼저다', async () => {
      server.use(
        invitationHistoryHandler(
          mockInvitationHistory.map(
            ({ inviterAvatarColor: _a, inviteeAvatarColor: _b, ...rest }) =>
              rest.status === 'IN_PROGRESS' ? { ...rest, inviterAvatarColor: '33903C' } : rest
          )
        )
      );
      renderPage();

      const [pending] = await findRows(REQUESTS);
      await waitFor(() => {
        expect(cellsOf(pending)[0]?.querySelector('[aria-hidden="true"]')).toHaveClass(
          'bg-id-orange'
        );
      });
      const [running] = await findRows(RUNNING);
      expect(cellsOf(running)[0]?.querySelector('[aria-hidden="true"]')).toHaveClass('bg-id-green');
    });

    it('응답에 색이 없으면 내 타일은 내 아바타 목록의 색을, 상대 타일은 회색을 입는다', async () => {
      const colorless = mockInvitationHistory.map(
        ({ inviterAvatarColor: _a, inviteeAvatarColor: _b, ...rest }) => rest
      );
      server.use(invitationHistoryHandler(colorless));
      renderPage();

      const [row] = await findRows(RUNNING);
      const cells = cellsOf(row);
      await waitFor(() => {
        expect(cells[0]?.querySelector('[aria-hidden="true"]')).toHaveClass('bg-id-pink');
      });
      expect(cells[1]?.querySelector('[aria-hidden="true"]')).toHaveClass('bg-id-none');
    });

    it('좁은 화면에서 숨는 내 아바타 · 구분 · 요청 시각은 상대 아바타 이름 아래 보조 줄에 남는다', async () => {
      renderPage();

      const [row] = await findRows(RUNNING);
      const partnerCell = cellsOf(row)[1] as HTMLElement;
      const mine = within(partnerCell).getByText('내 아바타 hyun_night');
      const direction = within(partnerCell).getByText('보낸 요청');
      const time = partnerCell.querySelector('time');

      expect(mine).toHaveClass('sm:hidden');
      expect(direction.parentElement).toHaveClass('xl:hidden');
      expect(time).toHaveClass('md:hidden');
      expect(time).toHaveAttribute(
        'datetime',
        mockInvitationHistory.find((item) => item.status === 'IN_PROGRESS')?.createdAt
      );
    });

    it('아바타 이름은 굵게 쓰지 않는다', async () => {
      renderPage();

      const [row] = await findRows(RUNNING);
      const cells = cellsOf(row);
      for (const name of [
        within(cells[0] as HTMLElement).getByText('hyun_night'),
        within(cells[1] as HTMLElement).getByRole('link', { name: '하늘' }),
      ]) {
        expect(name.className).not.toMatch(/font-(medium|semibold|bold)/);
      }
    });

    it('비고 칸의 "이동" 은 시뮬레이션 화면이 생길 때까지 비활성이다', async () => {
      renderPage();

      const [row] = await findRows(RUNNING);
      const move = within(row as HTMLElement).getByRole('button', {
        name: '하늘 시뮬레이션으로 이동 (준비 중)',
      });
      expect(move).toHaveTextContent('이동');
      expect(move).toBeDisabled();
    });

    it('수락만 된 것(ACCEPTED)도 "진행 중" 으로 이 표에 들어간다', async () => {
      server.use(
        invitationHistoryHandler(
          mockInvitationHistory.map((item) =>
            item.status === 'IN_PROGRESS' ? { ...item, status: 'ACCEPTED' as const } : item
          )
        )
      );
      renderPage();

      const rows = await findRows(RUNNING);
      expect(rows).toHaveLength(1);
      expect(cellsOf(rows[0])[3]).toHaveTextContent('진행 중');
    });

    it('상대 이름을 누르면 상대 아바타 상세로 간다', async () => {
      const user = userEvent.setup();
      renderPage();

      const [row] = await findRows(RUNNING);
      await user.click(within(row as HTMLElement).getByRole('link', { name: '하늘' }));

      expect(await screen.findByText('AVATAR_DETAIL')).toBeInTheDocument();
    });

    it('응답에 해시태그가 없으면 이름만 보인다', async () => {
      const bare = mockInvitationHistory.map(
        ({ inviterAvatarHashtag: _a, inviteeAvatarHashtag: _b, ...rest }) => rest
      );
      server.use(invitationHistoryHandler(bare));
      renderPage();

      const [row] = await findRows(RUNNING);
      expect(within(row as HTMLElement).getByRole('link', { name: '하늘' })).toBeInTheDocument();
      expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    });

    it('내 아바타 목록을 못 받아도 목록은 그대로 보인다', async () => {
      server.use(ownedAvatarsHandlers.serverError);
      renderPage();

      const [row] = await findRows(RUNNING);
      expect(within(row as HTMLElement).getByRole('link', { name: '하늘' })).toBeInTheDocument();
    });
  });

  describe('요청 내역', () => {
    it('응답 대기 중인 요청을 위에, 끝난 것을 아래에 최근 요청 순으로 보인다', async () => {
      renderPage();

      const rows = await findRows(REQUESTS);
      expect(rows.map((row) => within(row).getByRole('link').textContent)).toEqual([
        'Moonlit',
        '봄날',
        'Moonlit',
        '하늘',
        '하늘',
        'Moonlit',
      ]);
      expect(rows.map((row) => cellsOf(row)[3]?.textContent)).toEqual([
        '응답 대기',
        '응답 대기',
        '종료',
        '취소',
        '종료',
        '중단',
      ]);
    });

    it('요청 시각 칸은 요청한 시각을 time 요소로 싣고, 8일이 넘은 것은 "오래 전" 으로 보인다', async () => {
      renderPage();

      const rows = await findRows(REQUESTS);
      const times = rows.map((row) => cellsOf(row)[4]?.querySelector('time'));
      const requestedAts = new Set(mockInvitationHistory.map((item) => item.createdAt));
      for (const time of times) {
        expect(requestedAts.has(time?.getAttribute('datetime') ?? '')).toBe(true);
        expect(time?.textContent).toMatch(/ 전$/);
      }
      expect(times.at(-1)).toHaveTextContent('오래 전');
    });

    it('거절된 요청은 어느 표에도 없다', async () => {
      renderPage();

      const running = await findRows(RUNNING);
      const requests = await findRows(REQUESTS);
      expect(mockInvitationHistory.some((item) => item.status === 'REJECTED')).toBe(true);
      expect(running.length + requests.length).toBe(mockInvitationHistory.length - 1);
    });

    it('받은 대기 요청에는 남색 "수락", 보낸 대기 요청에는 빨간 "취소" 작은 버튼이 붙는다', async () => {
      renderPage();

      const rows = await findRows(REQUESTS);
      const accept = within(rows[0] as HTMLElement).getByRole('button', { name: ACCEPT });
      const cancel = within(rows[1] as HTMLElement).getByRole('button', { name: CANCEL });
      expect(accept).toHaveTextContent('수락');
      expect(accept).toHaveClass('bg-action', 'h-7');
      expect(cancel).toHaveTextContent('취소');
      expect(cancel).toHaveClass('bg-danger', 'h-7');
      expect(cellsOf(rows[0])[2]).toHaveTextContent('받은 요청');
      expect(cellsOf(rows[1])[2]).toHaveTextContent('보낸 요청');
    });

    it('끝난 행에는 버튼이 없다', async () => {
      renderPage();

      const rows = await findRows(REQUESTS);
      for (const row of rows.slice(2)) {
        expect(within(row).queryByRole('button')).not.toBeInTheDocument();
      }
    });
  });

  describe('받은 요청 수락', () => {
    it('수락을 누르면 그 요청을 수락하고, 성공 토스트와 함께 행이 진행 중인 시뮬레이션으로 옮겨 간다', async () => {
      const user = userEvent.setup();
      let acceptedId: string | undefined;
      server.events.on('request:start', ({ request }) => {
        const matched = /\/invitations\/([^/]+)\/accept$/.exec(new URL(request.url).pathname);
        if (request.method === 'POST' && matched) acceptedId = matched[1];
      });
      renderPage();

      await findRows(REQUESTS);
      await user.click(screen.getByRole('button', { name: ACCEPT }));

      expect(await screen.findByText('요청을 수락했어요')).toBeInTheDocument();
      expect(acceptedId).toBe(mockInvitationHistory[0]?.simulationInvitationId);
      await waitFor(async () => {
        expect(await findRows(RUNNING)).toHaveLength(2);
      });
      expect(screen.queryByRole('button', { name: ACCEPT })).not.toBeInTheDocument();
    });

    it('응답을 보내는 동안 그 버튼과 다른 행의 버튼이 모두 비활성이다', async () => {
      const user = userEvent.setup();
      server.use(
        http.post(`${BASE_URL}/api/simulations/invitations/:invitationId/accept`, async () => {
          await delay(200);
          return HttpResponse.json({ data: {} }, { status: 201 });
        })
      );
      renderPage();

      await findRows(REQUESTS);
      const accept = screen.getByRole('button', { name: ACCEPT });
      await user.click(accept);

      expect(accept).toBeDisabled();
      expect(accept).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('button', { name: CANCEL })).toBeDisabled();
      expect(await screen.findByText('요청을 수락했어요')).toBeInTheDocument();
    });

    it('그 사이 취소·만료된 요청이면 "이미 처리된 요청이에요" 로 알린다', async () => {
      const user = userEvent.setup();
      server.use(invitationAcceptHandlers.notPending);
      renderPage();

      await findRows(REQUESTS);
      await user.click(screen.getByRole('button', { name: ACCEPT }));

      expect(await screen.findByText('이미 처리된 요청이에요')).toBeInTheDocument();
    });

    it('서버 오류면 상단 에러 토스트로 알리고, 다시 눌러도 토스트는 하나만 남는다', async () => {
      const user = userEvent.setup();
      server.use(invitationAcceptHandlers.serverError);
      renderPage();

      await findRows(REQUESTS);
      const accept = screen.getByRole('button', { name: ACCEPT });
      await user.click(accept);
      expect(await screen.findByText('잠시 후 다시 시도해주세요')).toBeInTheDocument();

      await waitFor(() => {
        expect(accept).toBeEnabled();
      });
      await user.click(accept);

      await waitFor(() => {
        expect(accept).toBeEnabled();
      });
      expect(screen.getAllByText('잠시 후 다시 시도해주세요')).toHaveLength(1);
    });
  });

  describe('응답 뒤 캐시', () => {
    it.each([
      ['수락', ACCEPT],
      ['취소', CANCEL],
    ])(
      '%s하면 내 아바타 목록 캐시를 무효화한다 — 매칭 가능 여부가 달라진다',
      async (_label, name) => {
        const user = userEvent.setup();
        const { queryClient } = renderPage();

        await findRows(REQUESTS);
        await waitFor(() => {
          expect(queryClient.getQueryState(avatarKeys.myAvatars())?.status).toBe('success');
        });
        expect(queryClient.getQueryState(avatarKeys.myAvatars())?.isInvalidated).toBe(false);

        let invalidated = false;
        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
          if (
            event.type === 'updated' &&
            event.action.type === 'invalidate' &&
            event.query.queryKey.join() === avatarKeys.myAvatars().join()
          ) {
            invalidated = true;
          }
        });
        await user.click(screen.getByRole('button', { name }));

        await waitFor(() => {
          expect(invalidated).toBe(true);
        });
        unsubscribe();
      }
    );
  });

  describe('응답 뒤 상대 아바타 캐시', () => {
    const BOMNAL_ID = '33333333-3333-4333-8333-333333333333';
    const MOONLIT_ID = '44444444-4444-4444-8444-444444444444';

    it('취소하면 상대 아바타 상세와 추천 목록 캐시를 무효화한다 — 상대가 다시 요청을 받을 수 있게 된다', async () => {
      const user = userEvent.setup();
      const { queryClient } = renderPage();
      queryClient.setQueryData(avatarKeys.detail(BOMNAL_ID), {});
      queryClient.setQueryData(avatarKeys.candidates(8), { items: [] });

      await findRows(REQUESTS);
      await user.click(screen.getByRole('button', { name: CANCEL }));

      expect(await screen.findByText('요청을 취소했어요')).toBeInTheDocument();
      expect(queryClient.getQueryState(avatarKeys.detail(BOMNAL_ID))?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(avatarKeys.candidates(8))?.isInvalidated).toBe(true);
    });

    it('수락은 상대 아바타 캐시를 건드리지 않는다 — 상대는 그대로 진행 중이다', async () => {
      const user = userEvent.setup();
      const { queryClient } = renderPage();
      queryClient.setQueryData(avatarKeys.detail(MOONLIT_ID), {});
      queryClient.setQueryData(avatarKeys.candidates(8), { items: [] });

      await findRows(REQUESTS);
      await user.click(screen.getByRole('button', { name: ACCEPT }));

      expect(await screen.findByText('요청을 수락했어요')).toBeInTheDocument();
      expect(queryClient.getQueryState(avatarKeys.detail(MOONLIT_ID))?.isInvalidated).toBe(false);
      expect(queryClient.getQueryState(avatarKeys.candidates(8))?.isInvalidated).toBe(false);
    });
  });

  describe('응답이 실패했을 때', () => {
    it('수락이 실패해도 목록을 다시 받는다 — 그 사이 상대가 취소했으면 수락 버튼이 사라진다', async () => {
      const user = userEvent.setup();
      const canceledMeanwhile = mockInvitationHistory.map((item, index) =>
        index === 0 ? { ...item, status: 'CANCELED' as const } : item
      );
      server.use(
        http.post(`${BASE_URL}/api/simulations/invitations/:invitationId/accept`, () => {
          server.use(invitationHistoryHandler(canceledMeanwhile));
          return HttpResponse.json(
            { code: 'SIMULATION_400_004', message: 'CANCELED 시뮬레이션은 수락할 수 없습니다.' },
            { status: 400 }
          );
        })
      );
      renderPage();

      await findRows(REQUESTS);
      await user.click(screen.getByRole('button', { name: ACCEPT }));

      expect(await screen.findByText('이미 처리된 요청이에요')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: ACCEPT })).not.toBeInTheDocument();
      });
    });
  });

  describe('보낸 요청 취소', () => {
    it('취소를 누르면 그 요청을 취소하고, 성공 토스트와 함께 행이 "취소" 로 바뀌어 버튼이 사라진다', async () => {
      const user = userEvent.setup();
      let canceledId: string | undefined;
      server.events.on('request:start', ({ request }) => {
        const matched = /\/invitations\/([^/]+)\/cancel$/.exec(new URL(request.url).pathname);
        if (request.method === 'PATCH' && matched) canceledId = matched[1];
      });
      renderPage();

      await findRows(REQUESTS);
      await user.click(screen.getByRole('button', { name: CANCEL }));

      expect(await screen.findByText('요청을 취소했어요')).toBeInTheDocument();
      expect(canceledId).toBe(
        mockInvitationHistory.find((item) => item.status === 'PENDING' && item.direction === 'SENT')
          ?.simulationInvitationId
      );
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: CANCEL })).not.toBeInTheDocument();
      });
      const row = screen.getByRole('link', { name: '봄날' }).closest('tr') as HTMLElement;
      expect(cellsOf(row)[3]).toHaveTextContent('취소');
    });

    it('취소가 실패하면 상단 에러 토스트로 알리고 버튼은 다시 누를 수 있다', async () => {
      const user = userEvent.setup();
      server.use(invitationCancelHandlers.serverError);
      renderPage();

      await findRows(REQUESTS);
      const cancel = screen.getByRole('button', { name: CANCEL });
      await user.click(cancel);

      expect(await screen.findByText('잠시 후 다시 시도해주세요')).toBeInTheDocument();
      await waitFor(() => {
        expect(cancel).toBeEnabled();
      });
    });
  });

  describe('조회 계약', () => {
    it('보낸·받은 방향을 한 번씩, 상태 필터 없이 서버 상한 50건으로 조회한다 (direction 필수)', async () => {
      const requested: string[] = [];
      server.use(
        http.get(`${BASE_URL}/api/simulations/invitations`, ({ request }) => {
          requested.push(new URL(request.url).searchParams.toString());
          return HttpResponse.json({ data: { content: [], hasNext: false } });
        })
      );
      renderPage();

      await screen.findByText('아직 시작한 시뮬레이션이 없어요');
      expect(requested.sort()).toEqual(['direction=RECEIVED&size=50', 'direction=SENT&size=50']);
    });
  });

  describe('목록이 없을 때', () => {
    it('표 없이 안내 카드 하나만 보이고 안내문은 두지 않는다', async () => {
      server.use(invitationHistoryHandlers.empty);
      renderPage();

      const title = await screen.findByText('아직 시작한 시뮬레이션이 없어요');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(title.parentElement?.querySelectorAll('p')).toHaveLength(1);
    });

    it('안내 카드의 "추천 아바타 보기" 로 둘러보기에 간다', async () => {
      const user = userEvent.setup();
      server.use(invitationHistoryHandlers.empty);
      renderPage();

      await user.click(await screen.findByRole('button', { name: '추천 아바타 보기' }));

      expect(await screen.findByText('EXPLORE')).toBeInTheDocument();
    });
  });

  describe('조회 실패', () => {
    it('상단 에러 토스트로 알리고 표·빈 상태 문구는 보이지 않는다', async () => {
      server.use(invitationHistoryHandlers.serverError);
      renderPage();

      expect(await screen.findByText('시뮬레이션 목록을 불러오지 못했어요')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByText('아직 시작한 시뮬레이션이 없어요')).not.toBeInTheDocument();
    });
  });
});
