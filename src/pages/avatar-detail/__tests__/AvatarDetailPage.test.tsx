import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import type { QueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AvatarDetailPage } from '../AvatarDetailPage';
import {
  getLastRequestedAvatarId,
  resetAvatarDetailScenario,
  setAvatarDetailScenario,
} from '@shared/mocks/handlers/avatarDetail';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';

function renderPage(id = 'avatar-1', queryClient?: QueryClient) {
  return renderWithProviders(
    <Routes>
      <Route path="/avatars/:id" element={<AvatarDetailPage />} />
    </Routes>,
    { initialRoute: `/avatars/${id}`, ...(queryClient ? { queryClient } : {}) }
  );
}

beforeEach(() => {
  resetAvatarDetailScenario();
  useChromeBreadcrumbStore.getState().clearTrail();
});

afterEach(() => {
  resetAvatarDetailScenario();
  useChromeBreadcrumbStore.getState().clearTrail();
});

describe('AvatarDetailPage', () => {
  it('서버 상세 응답으로 프로필 헤더(이름·해시태그) + 스탯이 렌더된다', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Moonlit Narrator' })).toBeInTheDocument();
    expect(screen.getByText('#M00N7K')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '아바타 스탯' })).toBeInTheDocument();
  });

  // 서버 상세 응답에 나이대·지역·직군이 없어 공개 정보 패널을 두지 않는다.
  it('서버에 없는 공개 정보 패널과 세션 이력(호감도·턴)은 노출하지 않는다', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Moonlit Narrator' });
    expect(screen.queryByRole('heading', { name: '공개 정보' })).not.toBeInTheDocument();
    expect(screen.queryByText(/호감도/)).not.toBeInTheDocument();
    expect(screen.queryByText(/TURN/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '세션 이력' })).not.toBeInTheDocument();
  });

  it('마운트 후 chrome breadcrumb store 에 [홈, 대시보드, 아바타이름] 이 push 된다', async () => {
    renderPage();
    await waitFor(() => {
      expect(useChromeBreadcrumbStore.getState().trail).toEqual([
        '홈',
        '대시보드',
        'Moonlit Narrator',
      ]);
    });
  });

  it('서버 7지표가 대시보드 대표 아바타와 같은 레이더 + 값 표로 렌더된다', async () => {
    renderPage();
    await screen.findByRole('heading', { name: '아바타 스탯' });
    expect(screen.getByRole('img', { name: '아바타 스탯 레이더' })).toBeInTheDocument();
    expect(screen.getAllByRole('rowheader')).toHaveLength(7);
    expect(screen.getByRole('row', { name: '공감 81' })).toBeInTheDocument();
  });

  // 스켈레톤은 실제 콘텐츠와 같은 상자여야 로드 순간 아래가 밀리지 않는다(CLS).
  it('로딩 스켈레톤의 레이더 자리는 실제 레이더와 같은 높이다', async () => {
    renderPage();
    const placeholder = screen.getByTestId('stat-radar-skeleton');
    const skeletonHeight = placeholder.getAttribute('height');
    const radar = await screen.findByRole('img', { name: '아바타 스탯 레이더' });
    expect(radar.getAttribute('height')).toBe(skeletonHeight);
  });

  it('요청한 id 로 상세를 조회한다', async () => {
    renderPage('22222222-2222-4222-8222-222222222222');
    await screen.findByRole('heading', { name: 'Moonlit Narrator' });
    expect(getLastRequestedAvatarId()).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('"매칭 요청 보내기" CTA 클릭 시 MatchRequestModal 이 열린다', async () => {
    const user = userEvent.setup();
    renderPage();
    const trigger = await screen.findByRole('button', { name: /매칭 요청 보내기/ });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('본문에서 채워진 파란 CTA 는 한 개뿐이다', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Moonlit Narrator' });
    const filled = screen
      .getAllByRole('button')
      .filter((btn) => btn.className.split(' ').includes('bg-action'));
    expect(filled).toHaveLength(1);
    expect(filled[0]).toHaveAccessibleName(/매칭 요청 보내기/);
  });

  it('요청할 수 없는 아바타(canRequestSimulation=false)는 매칭 요청 CTA 가 disabled 처리된다', async () => {
    setAvatarDetailScenario('busy');
    renderPage();
    const cta = await screen.findByRole('button', { name: /매칭 요청 보내기/ });
    expect(cta).toBeDisabled();
    expect(screen.getByText('이미 매칭 중인 아바타예요')).toBeInTheDocument();
  });

  it('404 응답 시 "찾을 수 없어요" 에러 메시지를 노출한다', async () => {
    setAvatarDetailScenario('not-found');
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('아바타를 찾을 수 없어요');
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });

  it('400(UUID 형식이 아닌 id) 응답도 "찾을 수 없어요" 로 보여주고 재시도는 두지 않는다', async () => {
    setAvatarDetailScenario('bad-request');
    renderPage('not-a-uuid');
    expect(await screen.findByRole('alert')).toHaveTextContent('아바타를 찾을 수 없어요');
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });

  it('500 응답 시 본문 자리는 비우고 상단 에러 토스트로 알린다', async () => {
    setAvatarDetailScenario('server-error');
    renderPage();

    const toast = (await screen.findByText('아바타 정보를 불러오지 못했어요')).closest(
      '[role="status"]'
    );
    expect(toast).toHaveClass('bg-danger-tint');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });

  it('로딩이 실패한 상세를 떠났다 돌아오면 재요청해 화면을 채운다', async () => {
    setAvatarDetailScenario('server-error');
    const { queryClient, unmount } = renderPage();
    await screen.findByText('아바타 정보를 불러오지 못했어요');
    unmount();

    setAvatarDetailScenario('success');
    renderPage('avatar-1', queryClient);

    expect(await screen.findByRole('heading', { name: 'Moonlit Narrator' })).toBeInTheDocument();
    expect(screen.queryByText('아바타 정보를 불러오지 못했어요')).not.toBeInTheDocument();
  });
});
