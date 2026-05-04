import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import { ServiceIntroPage } from '../ServiceIntroPage';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ServiceIntroPage />
    </MemoryRouter>
  );
}

describe('ServiceIntroPage', () => {
  it('서비스 헤더 타이틀이 렌더된다', () => {
    renderPage();
    expect(screen.getByText('Avating')).toBeInTheDocument();
  });

  it('메인 헤드카피가 렌더된다', () => {
    renderPage();
    expect(screen.getByText(/귀찮은 밀당은 아바타가/)).toBeInTheDocument();
  });

  it('기능 카드 3개가 렌더된다', () => {
    renderPage();
    expect(screen.getByText('아바타 매칭')).toBeInTheDocument();
    expect(screen.getByText('답답해? 직접 뛰어!')).toBeInTheDocument();
    expect(screen.getAllByText('에프터 연결').length).toBeGreaterThanOrEqual(1);
  });

  it('가입하기 버튼이 렌더된다', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /가입하기/i })).toBeInTheDocument();
  });

  it('헤더 "로그인" 버튼 클릭 시 /login 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderPage();
    const loginBtns = screen.getAllByRole('button', { name: /로그인/i });
    await user.click(loginBtns[0]!);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('"가입하기" 버튼 클릭 시 /signup 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /가입하기/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('섹션 "로그인" 버튼 클릭 시 /login 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderPage();
    const loginBtns = screen.getAllByRole('button', { name: /로그인/i });
    await user.click(loginBtns[loginBtns.length - 1]!);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('누적 매칭 지표 카드가 렌더된다', () => {
    renderPage();
    expect(screen.getByText('4.2만+')).toBeInTheDocument();
    expect(screen.getByText('누적 매칭')).toBeInTheDocument();
  });
});
