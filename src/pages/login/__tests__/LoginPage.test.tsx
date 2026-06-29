import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LoginPage } from '../LoginPage';

vi.mock('@features/auth/lib/encryptPassword', () => ({
  encryptPassword: vi.fn(),
}));

describe('LoginPage', () => {
  it('단일 패널 변형: 브랜드 비주얼(aside)을 렌더하지 않는다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('제목 "돌아오신 걸 환영합니다" 가 렌더된다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /돌아오신 걸 환영합니다/ })).toBeInTheDocument();
  });

  it('LoginForm이 포함된다 (이메일 input 존재)', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
  });
});
