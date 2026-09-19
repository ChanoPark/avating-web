import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { saveDraft, loadDraft } from '@features/persona-survey/lib/draftStorage';
import { useAuthStore } from '@entities/auth/store';
import { SignupPage } from '../SignupPage';

vi.mock('@features/auth/lib/encryptPassword', () => ({
  encryptPassword: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

vi.mock('@features/auth/ui/SignupForm', () => ({
  SignupForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" onClick={() => onSuccess?.()}>
      mock-submit
    </button>
  ),
}));

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ status: 'anonymous', accessToken: null, expiresAt: null });
  });

  it('우측 이용 안내(HOW IT WORKS)를 렌더하지 않는다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.queryByRole('complementary', { name: /이용 안내/ })).not.toBeInTheDocument();
    expect(screen.queryByText('HOW IT WORKS')).not.toBeInTheDocument();
  });

  it('계정 만들기 제목만 렌더하고 서브카피·하단 각주는 두지 않는다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByRole('heading', { name: /계정 만들기/i })).toBeInTheDocument();
    expect(screen.queryByText(/2분이면 아바타를/)).not.toBeInTheDocument();
    expect(screen.queryByText(/가입하면 아바타 생성 온보딩으로/)).not.toBeInTheDocument();
  });

  it('폼 카드 상단에 Avating 로고가 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    const formCard = screen.getByRole('region', { name: '계정 만들기' });
    expect(within(formCard).getByText('Avating')).toBeInTheDocument();
  });

  describe('상단 헤더', () => {
    it('랜딩과 같은 상단 헤더(로고·내비·로그인/회원가입)를 렌더한다', () => {
      renderWithProviders(<SignupPage />);
      const banner = screen.getByRole('banner');

      expect(banner).toHaveTextContent('Avating');
      expect(within(banner).getByText('서비스 소개')).toBeInTheDocument();
      expect(within(banner).getByText('작동 방식')).toBeInTheDocument();
      expect(within(banner).getByText('요금')).toBeInTheDocument();
      expect(within(banner).getByRole('button', { name: '로그인' })).toBeInTheDocument();
      expect(within(banner).getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    });

    it('헤더의 로그인 버튼은 /login 으로 이동한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupPage />);

      await user.click(within(screen.getByRole('banner')).getByRole('button', { name: '로그인' }));

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('헤더 내비는 랜딩의 해당 섹션으로 보낸다 — 가입 화면에는 스크롤할 섹션이 없다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupPage />);
      const banner = screen.getByRole('banner');

      await user.click(within(banner).getByRole('button', { name: '작동 방식' }));
      expect(mockNavigate).toHaveBeenLastCalledWith('/#how-it-works');

      await user.click(within(banner).getByRole('button', { name: '서비스 소개' }));
      expect(mockNavigate).toHaveBeenLastCalledWith('/#service-intro-hero');
    });
  });

  it('SignupForm 의 onSuccess 발생 시 /onboarding 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />);

    await user.click(screen.getByRole('button', { name: /mock-submit/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  describe('가입 성공 시 이전 온보딩 흔적 정리', () => {
    it('이전 계정의 진행도·생성방법 기록을 지운다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');
      localStorage.setItem('avating:onboarding:method', 'connect');
      const user = userEvent.setup();
      renderWithProviders(<SignupPage />);

      await user.click(screen.getByRole('button', { name: /mock-submit/i }));

      expect(localStorage.getItem('avating:onboarding:progress')).toBeNull();
      expect(localStorage.getItem('avating:onboarding:method')).toBeNull();
    });

    it('이전 계정의 설문 draft(이름·설명·답변)를 지운다', async () => {
      saveDraft({
        answers: { Q_001: 'Q_001_ANS_1' },
        avatarName: '앞사람',
        description: '앞 설명',
      });
      const user = userEvent.setup();
      renderWithProviders(<SignupPage />);

      await user.click(screen.getByRole('button', { name: /mock-submit/i }));

      expect(loadDraft()).toBeNull();
    });
  });

  describe('이미 로그인한 상태', () => {
    it('가입 화면 대신 온보딩으로 보낸다', () => {
      useAuthStore.setState({
        status: 'authenticated',
        accessToken: 'a',
        expiresAt: Date.now() + 1000,
      });
      renderWithProviders(<SignupPage />);

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding', { replace: true });
    });
  });
});
