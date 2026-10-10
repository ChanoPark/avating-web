import { describe, it, expect, afterEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { server } from '@shared/mocks/server';
import {
  invitationHistoryHandler,
  invitationHistoryHandlers,
  mockInvitationHistory,
} from '@shared/mocks/handlers/invitationHistory';
import { controlledSessionStream } from '@shared/mocks/handlers/simulationWatch';
import { useSessionPaneStore } from '@features/simulation-watch';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SimulationChatIndexPage } from '../SimulationChatIndexPage';
import { SimulationLayout } from '../SimulationLayout';
import { SimulationSessionsPage } from '../SimulationSessionsPage';
import { SimulationWatchPage } from '../SimulationWatchPage';

// hyun_night(내 아바타)가 하늘에게 보내 진행 중인 세션
const RUNNING_ID = 'dddddddd-0001-4000-8000-000000000001';
// hyunwoo(내 아바타)가 Moonlit 에게 보내 끝난 세션
const DONE_ID = 'dddddddd-0003-4000-8000-000000000003';

const TABS = '시뮬레이션 보기';

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/sim" element={<SimulationLayout />}>
        <Route index element={<SimulationSessionsPage />} />
        <Route path="chat" element={<SimulationChatIndexPage />} />
        <Route path=":sessionId" element={<SimulationWatchPage />} />
      </Route>
      <Route path="/explore" element={<div>EXPLORE</div>} />
    </Routes>,
    { initialRoute: route }
  );
}

function tab(name: string): HTMLElement {
  return within(screen.getByRole('navigation', { name: TABS })).getByRole('link', { name });
}

afterEach(() => {
  useSessionPaneStore.setState(useSessionPaneStore.getInitialState(), true);
});

describe('SimulationLayout — 목록 · 채팅 탭', () => {
  it('맨 위에 목록 · 채팅 탭을 두고, 본문을 셸 여백 없이 채우겠다고 셸에 알린다', () => {
    const { container } = renderAt('/sim');

    expect(tab('목록')).toHaveAttribute('href', '/sim');
    expect(tab('채팅')).toHaveAttribute('href', '/sim/chat');
    expect(container.querySelector('[data-shell-flush]')).not.toBeNull();
  });

  it('목록 화면에서는 목록 탭이, 채팅 화면에서는 채팅 탭이 현재 위치다', async () => {
    const list = renderAt('/sim');
    expect(tab('목록')).toHaveAttribute('aria-current', 'page');
    expect(tab('채팅')).not.toHaveAttribute('aria-current');
    list.unmount();

    renderAt(`/sim/${DONE_ID}`);
    expect(tab('채팅')).toHaveAttribute('aria-current', 'page');
    expect(tab('목록')).not.toHaveAttribute('aria-current');
    await screen.findByRole('log', { name: '대화 기록' });
  });

  it('채팅 탭을 누르면 진행 중인 시뮬레이션의 대화부터 연다', async () => {
    const user = userEvent.setup();
    server.use(controlledSessionStream().handler);
    renderAt('/sim');

    await user.click(tab('채팅'));

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('hyun_night');
    expect(
      within(screen.getByRole('navigation', { name: '시뮬레이션 목록' })).getByRole('link', {
        current: 'page',
      })
    ).toHaveAttribute('href', `/sim/${RUNNING_ID}`);
  });

  it('진행 중인 것이 없으면 가장 최근에 끝난 시뮬레이션의 대화를 연다', async () => {
    server.use(
      invitationHistoryHandler(
        mockInvitationHistory.filter((item) => item.status !== 'IN_PROGRESS')
      )
    );
    renderAt('/sim/chat');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('hyunwoo');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Moonlit');
  });

  it('보던 대화가 있으면 채팅 탭은 그 대화로 돌아간다', async () => {
    const user = userEvent.setup();
    renderAt(`/sim/${DONE_ID}`);
    await screen.findByRole('log', { name: '대화 기록' });

    await user.click(tab('목록'));
    expect(
      await screen.findByRole('heading', { level: 1, name: '시뮬레이션' })
    ).toBeInTheDocument();
    await user.click(tab('채팅'));

    expect(await screen.findByRole('log', { name: '대화 기록' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('hyunwoo');
  });

  it('채팅 탭으로 들어와 열 대화를 찾는 동안 대화 자리에 스켈레톤을 세운다', async () => {
    renderAt('/sim/chat');

    expect(screen.getByText('대화를 불러오는 중…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('hyun_night');
  });

  it('볼 수 있는 대화가 하나도 없으면 채팅 탭에서 그렇다고 알린다', async () => {
    const user = userEvent.setup();
    server.use(invitationHistoryHandlers.empty);
    renderAt('/sim/chat');

    expect(await screen.findByText('아직 볼 수 있는 대화가 없어요')).toBeInTheDocument();
    expect(tab('채팅')).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: '추천 아바타 보기' }));
    expect(await screen.findByText('EXPLORE')).toBeInTheDocument();
  });

  it('채팅 탭에서 목록을 못 받으면 상단 토스트로 알린다', async () => {
    server.use(invitationHistoryHandlers.serverError);
    renderAt('/sim/chat');

    expect(await screen.findByText('시뮬레이션 목록을 불러오지 못했어요')).toBeInTheDocument();
    expect(screen.queryByText('아직 볼 수 있는 대화가 없어요')).not.toBeInTheDocument();
  });
});
