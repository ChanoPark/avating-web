import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AvatarDetailPage } from '../AvatarDetailPage';
import {
  resetAvatarDetailScenario,
  setAvatarDetailScenario,
} from '@shared/mocks/handlers/avatarDetail';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';

function renderPage(id = 'avatar-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/avatars/:id" element={<AvatarDetailPage />} />
    </Routes>,
    { initialRoute: `/avatars/${id}` }
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
  it('와이어프레임의 프로필 헤더 + 스탯 + 세션 이력 영역이 렌더된다', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Moonlit Narrator' })).toBeInTheDocument();
    expect(screen.getByText('@moonlit · 내향·낭만형')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '아바타 스탯' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '세션 이력' })).toBeInTheDocument();
  });

  it('마운트 후 chrome breadcrumb store 에 [홈, 탐색, 아바타이름] 이 push 된다', async () => {
    renderPage();
    await waitFor(() => {
      expect(useChromeBreadcrumbStore.getState().trail).toEqual(['홈', '탐색', 'Moonlit Narrator']);
    });
  });

  it('HexRadar 와 6개의 Meter 가 렌더된다 (6축 스탯)', async () => {
    renderPage();
    await screen.findByRole('img', { name: '아바타 스탯 레이더' });
    expect(screen.getAllByRole('meter')).toHaveLength(6);
    expect(screen.getByRole('meter', { name: '공감 지수' })).toHaveAttribute('aria-valuenow', '81');
  });

  it('세션 이력 row 가 turn + 결과 Tag + 호감도 를 표시한다', async () => {
    renderPage();
    await screen.findByRole('heading', { name: '세션 이력' });
    expect(screen.getByText('TURN 12/12')).toBeInTheDocument();
    expect(screen.getByText('매칭 성공')).toBeInTheDocument();
    expect(screen.getByText('호감도 91')).toBeInTheDocument();
    expect(screen.getByText('TURN 8/12')).toBeInTheDocument();
    expect(screen.getByText('종료')).toBeInTheDocument();
    expect(screen.getByText('호감도 62')).toBeInTheDocument();
  });

  it('관전 CTA 는 v1 에서 disabled + 준비 중 안내를 가진다', async () => {
    renderPage();
    const watch = await screen.findByRole('button', { name: '관전 (준비 중)' });
    expect(watch).toBeDisabled();
    expect(watch).toHaveAttribute('title', '관전 화면 준비 중');
  });

  it('"매칭 요청" CTA 클릭 시 MatchRequestModal 이 열린다', async () => {
    const user = userEvent.setup();
    renderPage();
    const trigger = await screen.findByRole('button', { name: '매칭 요청' });
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

  it('busy 상태 아바타는 매칭 요청 CTA 가 disabled 처리된다', async () => {
    setAvatarDetailScenario('busy');
    renderPage();
    const cta = await screen.findByRole('button', { name: '매칭 요청' });
    expect(cta).toBeDisabled();
    expect(cta).toHaveAttribute('title', '이미 매칭 중인 아바타입니다');
  });

  it('404 응답 시 "찾을 수 없어요" 에러 메시지를 노출한다', async () => {
    setAvatarDetailScenario('not-found');
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('아바타를 찾을 수 없어요');
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });

  it('500 응답 시 에러 메시지 + "다시 시도" 가 노출된다', async () => {
    setAvatarDetailScenario('server-error');
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했어요');
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });
});
