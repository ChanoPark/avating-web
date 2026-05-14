import { screen } from '@testing-library/react';
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

  it('Avating 브랜드 패널이 좌측에 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByRole('complementary', { name: /브랜드/ })).toHaveTextContent(/Avating/);
  });

  it('브랜드 패널에 "귀찮은 밀당은 아바타가" 헤드카피가 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByText(/귀찮은 밀당은 아바타가/)).toBeInTheDocument();
  });

  it('브랜드 패널에 3종 피처 체크리스트가 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByText('책임 없는 도파민')).toBeInTheDocument();
    expect(screen.getByText('답답하면 훈수 한 스푼')).toBeInTheDocument();
    expect(screen.getByText('나답게 움직이는 AI 생성')).toBeInTheDocument();
  });

  it('계정 만들기 제목이 폼 패널에 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByRole('heading', { name: /계정 만들기/i })).toBeInTheDocument();
  });

  it('SignupForm 의 onSuccess 발생 시 /onboarding 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />);

    await user.click(screen.getByRole('button', { name: /mock-submit/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });
});
