import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LoginPage } from '../LoginPage';

vi.mock('@features/auth/lib/encryptPassword', () => ({
  encryptPassword: vi.fn(),
}));

describe('LoginPage', () => {
  it('로그인 제목이 렌더된다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /로그인/i })).toBeInTheDocument();
  });

  it('LoginForm이 포함된다 (이메일 input 존재)', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
  });
});
