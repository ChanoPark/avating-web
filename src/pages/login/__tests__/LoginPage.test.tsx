import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LoginPage } from '../LoginPage';

vi.mock('@features/auth/lib/encryptPassword', () => ({
  encryptPassword: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('우측 이용 안내(HOW IT WORKS)를 렌더하지 않는다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.queryByRole('complementary', { name: /이용 안내/ })).not.toBeInTheDocument();
    expect(screen.queryByText('HOW IT WORKS')).not.toBeInTheDocument();
  });

  describe('상단 헤더', () => {
    it('가입 화면과 같은 상단 헤더(로고·내비·로그인/회원가입)를 렌더한다', () => {
      renderWithProviders(<LoginPage />);
      const banner = screen.getByRole('banner');

      expect(banner).toHaveTextContent('Avating');
      expect(within(banner).getByText('서비스 소개')).toBeInTheDocument();
      expect(within(banner).getByText('작동 방식')).toBeInTheDocument();
      expect(within(banner).getByText('요금')).toBeInTheDocument();
      expect(within(banner).getByRole('button', { name: '로그인' })).toBeInTheDocument();
      expect(within(banner).getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    });

    it('헤더의 회원가입 버튼은 /signup 으로 이동한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.click(
        within(screen.getByRole('banner')).getByRole('button', { name: '회원가입' })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });

    it('헤더 내비는 랜딩의 해당 섹션으로 보낸다 — 로그인 화면에는 스크롤할 섹션이 없다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);
      const banner = screen.getByRole('banner');

      await user.click(within(banner).getByRole('button', { name: '작동 방식' }));
      expect(mockNavigate).toHaveBeenLastCalledWith('/#how-it-works');

      await user.click(within(banner).getByRole('button', { name: '서비스 소개' }));
      expect(mockNavigate).toHaveBeenLastCalledWith('/#service-intro-hero');
    });
  });

  it('제목 "다시 만나서 반가워요" 와 서브카피가 렌더된다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /다시 만나서 반가워요/ })).toBeInTheDocument();
    expect(screen.getByText('아바타의 대화가 기다리고 있어요.')).toBeInTheDocument();
  });

  it('폼 카드 상단에 Avating 로고가 렌더된다', () => {
    renderWithProviders(<LoginPage />);
    const formCard = screen.getByRole('region', { name: '다시 만나서 반가워요' });
    expect(within(formCard).getByText('Avating')).toBeInTheDocument();
  });

  it('LoginForm이 포함된다 (이메일 input 존재)', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
  });
});
