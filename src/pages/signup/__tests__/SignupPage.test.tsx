import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SignupPage } from '../SignupPage';

vi.mock('@features/auth/lib/encryptPassword', () => ({
  encryptPassword: vi.fn(),
}));

describe('SignupPage', () => {
  it('회원가입 제목이 렌더된다', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByRole('heading', { name: /회원가입/i })).toBeInTheDocument();
  });

  it('SignupForm이 포함된다 (이메일 input 존재)', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
  });
});
