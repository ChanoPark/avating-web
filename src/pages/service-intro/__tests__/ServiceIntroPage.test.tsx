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
  it('Avating 로고가 헤더에 렌더된다', () => {
    renderPage();
    expect(screen.getByRole('banner')).toHaveTextContent('Avating');
  });

  it('BETA 태그가 렌더된다', () => {
    renderPage();
    expect(screen.getByText(/BETA · 인터랙티브 소셜 게임/)).toBeInTheDocument();
  });

  it('메인 헤드카피가 렌더된다', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/귀찮은 밀당은 아바타가/);
  });

  it('서브카피에서 "매칭" 단어를 사용한다 (파견 금지)', () => {
    renderPage();
    expect(screen.getByText(/AI 아바타를 소개팅에 매칭하고/)).toBeInTheDocument();
  });

  it('기능 카드 3개가 렌더된다', () => {
    renderPage();
    expect(screen.getByText('아바타 매칭')).toBeInTheDocument();
    expect(screen.getByText('답답해? 직접 뛰어!')).toBeInTheDocument();
    expect(screen.getAllByText('에프터 연결').length).toBeGreaterThanOrEqual(1);
  });

  it('누적 매칭 / 평균 호감도 / 에프터 연결 지표가 렌더된다', () => {
    renderPage();
    expect(screen.getByText('4.2만+')).toBeInTheDocument();
    expect(screen.getByText('누적 매칭')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('평균 호감도')).toBeInTheDocument();
    expect(screen.getByText('1.1만')).toBeInTheDocument();
  });

  it('하단 CTA 영역에 "회원가입" primary 와 "로그인" secondary 가 함께 있다', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /회원가입/i })).toBeInTheDocument();
    const loginButtons = screen.getAllByRole('button', { name: /^로그인$/i });
    expect(loginButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('헤더 "로그인" 버튼 클릭 시 /login 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderPage();
    const loginBtns = screen.getAllByRole('button', { name: /^로그인$/i });
    await user.click(loginBtns[0]!);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('"회원가입" 버튼 클릭 시 /signup 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /회원가입/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('섹션 하단 "로그인" 버튼 클릭 시 /login 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderPage();
    const loginBtns = screen.getAllByRole('button', { name: /^로그인$/i });
    await user.click(loginBtns[loginBtns.length - 1]!);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
