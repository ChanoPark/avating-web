import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
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
  });

  it('2단 구성: 우측 AuthAside(complementary)를 렌더한다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByRole('complementary', { name: /이용 안내/ })).toBeInTheDocument();
  });

  it('AuthAside 에 HOW IT WORKS eyebrow 와 정본 3항목이 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    const aside = screen.getByRole('complementary', { name: /이용 안내/ });

    expect(within(aside).getByText('HOW IT WORKS')).toBeInTheDocument();
    expect(within(aside).getByText('아바타 생성')).toBeInTheDocument();
    expect(within(aside).getByText('성향 설문 또는 Bot 연동')).toBeInTheDocument();
    // 문항 수는 서버 시딩에 따라 달라진다 — 문구에 고정 숫자를 두지 않는다.
    expect(within(aside).queryByText(/\d+문항/)).not.toBeInTheDocument();
    expect(within(aside).getByText('시뮬레이션 관전')).toBeInTheDocument();
    expect(within(aside).getByText('아바타끼리 대화, 훈수로 개입')).toBeInTheDocument();
    expect(within(aside).getByText('에프터 연결')).toBeInTheDocument();
    expect(within(aside).getByText('호감도 75 이상이면 실제 채팅')).toBeInTheDocument();
  });

  it('AuthAside 하단에 본인 인증 안내 Note 가 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    const aside = screen.getByRole('complementary', { name: /이용 안내/ });
    expect(
      within(aside).getByText(/가입 시 본인 인증은 받지 않습니다 — 실제 연결 시점에만 1회 진행/)
    ).toBeInTheDocument();
  });

  it('폼 카드 아래에 온보딩 이동 각주가 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    expect(
      screen.getByText('가입하면 아바타 생성 온보딩으로 바로 이동합니다.')
    ).toBeInTheDocument();
  });

  it('계정 만들기 제목과 서브카피가 폼 카드에 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByRole('heading', { name: /계정 만들기/i })).toBeInTheDocument();
    expect(
      screen.getByText('2분이면 아바타를 만들고 첫 매칭을 시작할 수 있어요.')
    ).toBeInTheDocument();
  });

  it('폼 카드 상단에 Avating 로고가 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByText('Avating')).toBeInTheDocument();
  });

  it('SignupForm 의 onSuccess 발생 시 /onboarding 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />);

    await user.click(screen.getByRole('button', { name: /mock-submit/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });
});
