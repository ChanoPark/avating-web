import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useParams } from 'react-router';
import { server } from '@shared/mocks/server';
import {
  invitationHistoryHandler,
  invitationHistoryHandlers,
  mockInvitationHistory,
} from '@shared/mocks/handlers/invitationHistory';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SimulationSessionsPage } from '../SimulationSessionsPage';

const RUNNING = '진행 중인 시뮬레이션';
const ENDED = '끝난 시뮬레이션';

function WatchProbe() {
  const { sessionId } = useParams();
  return <div>WATCH {sessionId}</div>;
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/sim" element={<SimulationSessionsPage />} />
      <Route path="/sim/:sessionId" element={<WatchProbe />} />
      <Route path="/explore" element={<div>EXPLORE</div>} />
      <Route path="/avatars/:id" element={<div>AVATAR_DETAIL</div>} />
    </Routes>,
    { initialRoute: '/sim' }
  );
}

async function findRows(tableName: string): Promise<HTMLElement[]> {
  const table = await screen.findByRole('table', { name: tableName });
  return within(table).getAllByRole('row').slice(1);
}

function cellsOf(row: HTMLElement | undefined): HTMLElement[] {
  return within(row as HTMLElement).getAllByRole('cell');
}

describe('SimulationSessionsPage', () => {
  it('페이지 제목을 h1 으로 보인다', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: '시뮬레이션' })).toBeInTheDocument();
  });

  it('불러오는 동안 목록 자리에 스켈레톤을 세운다', () => {
    renderPage();
    expect(screen.getByText('시뮬레이션 목록을 불러오는 중…')).toBeInTheDocument();
  });

  describe('표 구성 — 매칭 요청 화면과 같은 표', () => {
    it('진행 중인 시뮬레이션을 위에, 끝난 시뮬레이션을 아래에 따로 보인다', async () => {
      renderPage();

      await screen.findByRole('table', { name: RUNNING });
      expect(
        screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
      ).toEqual([RUNNING, ENDED]);
    });

    it('두 표 모두 내 아바타 · 상대 아바타 · 상태 · 요청 시각 · 비고 컬럼을 두고, 구분(보낸 · 받은 요청)은 두지 않는다', async () => {
      renderPage();

      for (const name of [RUNNING, ENDED]) {
        const table = await screen.findByRole('table', { name });
        expect(
          within(table)
            .getAllByRole('columnheader')
            .map((header) => header.textContent)
        ).toEqual(['내 아바타', '상대 아바타', '상태', '요청 시각', '비고']);
      }
      expect(screen.queryByText('보낸 요청')).not.toBeInTheDocument();
      expect(screen.queryByText('받은 요청')).not.toBeInTheDocument();
    });

    it('대화가 열린 적 없는 요청(대기 · 취소 · 거절)은 목록에 없다', async () => {
      renderPage();

      expect(await findRows(RUNNING)).toHaveLength(1);
      expect(await findRows(ENDED)).toHaveLength(3);
      expect(screen.queryByText('봄날')).not.toBeInTheDocument();
      expect(screen.queryByText('응답 대기')).not.toBeInTheDocument();
      expect(screen.queryByText('취소')).not.toBeInTheDocument();
    });

    it('진행 중인 것이 없으면 위 표를 두지 않는다', async () => {
      server.use(
        invitationHistoryHandler(
          mockInvitationHistory.filter((item) => item.status !== 'IN_PROGRESS')
        )
      );
      renderPage();

      await screen.findByRole('table', { name: ENDED });
      expect(screen.queryByRole('table', { name: RUNNING })).not.toBeInTheDocument();
    });
  });

  describe('진행 중인 시뮬레이션', () => {
    it('행에 내 아바타 · 상대 아바타 · 상태 · 요청 시각을 칸을 나눠 보인다', async () => {
      renderPage();

      const [row] = await findRows(RUNNING);
      const cells = cellsOf(row);
      expect(within(cells[0] as HTMLElement).getByText('hyun_night')).toBeInTheDocument();
      expect(within(cells[0] as HTMLElement).getByText('#HN8R2Q')).toBeInTheDocument();
      expect(
        within(cells[1] as HTMLElement).getByRole('link', { name: '하늘' })
      ).toBeInTheDocument();
      expect(within(cells[1] as HTMLElement).getByText('#H7K2MP')).toBeInTheDocument();
      expect(cells).toHaveLength(5);
      expect(cells[2]).toHaveTextContent('진행 중');
      expect(cells[3]?.querySelector('time')).toHaveAttribute(
        'datetime',
        mockInvitationHistory.find((item) => item.status === 'IN_PROGRESS')?.createdAt
      );
    });

    it('비고 칸의 "관전하기" 를 누르면 그 세션의 관전 화면으로 간다', async () => {
      const user = userEvent.setup();
      renderPage();

      const move = await screen.findByRole('button', { name: '하늘 시뮬레이션 관전하기' });
      expect(move).toHaveTextContent('관전하기');
      await user.click(move);

      expect(
        await screen.findByText('WATCH dddddddd-0001-4000-8000-000000000001')
      ).toBeInTheDocument();
    });
  });

  describe('끝난 시뮬레이션', () => {
    it('최근 요청 순으로 놓고 종료 · 중단을 상태 칸에 보인다', async () => {
      renderPage();

      const rows = await findRows(ENDED);
      expect(rows.map((row) => cellsOf(row)[2]?.textContent)).toEqual(['종료', '종료', '중단']);
    });

    it('받은 요청으로 시작한 세션은 초대받은 쪽이 내 아바타다', async () => {
      renderPage();

      const cells = cellsOf((await findRows(ENDED))[2]);
      expect(within(cells[0] as HTMLElement).getByText('여름')).toBeInTheDocument();
      expect(
        within(cells[1] as HTMLElement).getByRole('link', { name: 'Moonlit' })
      ).toBeInTheDocument();
    });

    it('비고 칸의 "결과 보기" 를 누르면 그 세션의 대화 화면으로 간다', async () => {
      const user = userEvent.setup();
      renderPage();

      const move = await screen.findByRole('button', { name: '하늘 시뮬레이션 결과 보기' });
      expect(move).toHaveTextContent('결과 보기');
      await user.click(move);

      expect(
        await screen.findByText('WATCH dddddddd-0004-4000-8000-000000000004')
      ).toBeInTheDocument();
    });
  });

  it('응답에 simulationId 가 없는 세션은 행은 보이되 들어가는 버튼이 비활성이다', async () => {
    server.use(
      invitationHistoryHandler(
        mockInvitationHistory.map(({ simulationId: _simulationId, ...item }) => item)
      )
    );
    renderPage();

    expect(await findRows(RUNNING)).toHaveLength(1);
    expect(await findRows(ENDED)).toHaveLength(3);
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });

  it('세션이 하나도 없으면 안내와 함께 추천 아바타로 가는 버튼을 보인다', async () => {
    const user = userEvent.setup();
    server.use(invitationHistoryHandlers.empty);
    renderPage();

    expect(await screen.findByText('아직 시작한 시뮬레이션이 없어요')).toBeInTheDocument();
    expect(screen.getByText('매칭이 수락되면 여기서 관전할 수 있어요')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '추천 아바타 보기' }));
    expect(await screen.findByText('EXPLORE')).toBeInTheDocument();
  });

  it('목록을 못 받으면 상단 토스트로 알린다', async () => {
    server.use(invitationHistoryHandlers.serverError);
    renderPage();

    expect(await screen.findByText('시뮬레이션 목록을 불러오지 못했어요')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('아직 시작한 시뮬레이션이 없어요')).not.toBeInTheDocument();
  });
});
