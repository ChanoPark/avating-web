import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { server } from '@shared/mocks/server';
import { simCandidatesHandlers } from '@shared/mocks/handlers/avatarCandidates';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ExplorePage } from '../ExplorePage';

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/avatars/:id" element={<div>AVATAR_DETAIL</div>} />
    </Routes>,
    { initialRoute: '/explore' }
  );
}

describe('ExplorePage', () => {
  it('페이지 제목을 h1 으로 보인다', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: '둘러보기' })).toBeInTheDocument();
  });

  it('추천 아바타 목록을 보여준다', async () => {
    renderPage();

    const list = await screen.findByRole('list', { name: '추천 아바타 목록' });
    expect(within(list).getByRole('button', { name: '하늘#H7K2MP' })).toBeInTheDocument();
  });

  it('아바타 카드를 누르면 아바타 상세로 간다', async () => {
    const user = userEvent.setup();
    renderPage();

    const list = await screen.findByRole('list', { name: '추천 아바타 목록' });
    await user.click(within(list).getByRole('button', { name: '하늘#H7K2MP' }));

    expect(await screen.findByText('AVATAR_DETAIL')).toBeInTheDocument();
  });

  it('추천 아바타를 못 받으면 상단 에러 토스트로 알린다', async () => {
    server.use(simCandidatesHandlers.serverError);
    renderPage();

    expect(await screen.findByText('추천 아바타를 불러오지 못했어요')).toBeInTheDocument();
  });
});
