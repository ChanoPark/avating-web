import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LoginPage } from '../LoginPage';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

vi.mock('@features/auth/ui/LoginForm', () => ({
  LoginForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" onClick={() => onSuccess?.()}>
      mock-submit
    </button>
  ),
}));

describe('LoginPage 로그인 성공 후 이동', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirect 파라미터가 없으면 /dashboard 로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { initialRoute: '/login' });

    await user.click(screen.getByRole('button', { name: /mock-submit/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('redirect 파라미터의 동일 출처 경로로 이동한다 (AuthGuard 딥링크 복귀)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { initialRoute: '/login?redirect=%2Fonboarding' });

    await user.click(screen.getByRole('button', { name: /mock-submit/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('오픈 리다이렉트(프로토콜-상대 //evil.com)는 무시하고 /dashboard 로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { initialRoute: '/login?redirect=%2F%2Fevil.com' });

    await user.click(screen.getByRole('button', { name: /mock-submit/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('오픈 리다이렉트(절대 URL)는 무시하고 /dashboard 로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, {
      initialRoute: '/login?redirect=https%3A%2F%2Fevil.com',
    });

    await user.click(screen.getByRole('button', { name: /mock-submit/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
