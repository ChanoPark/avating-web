import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { ToastProvider } from '@shared/ui/Toast/Toast';
import { LoginPage } from '../LoginPage';

vi.mock('@features/auth/lib/encryptPassword', () => ({
  encryptPassword: vi.fn(),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(ToastProvider, null, children)
  );
}

describe('LoginPage', () => {
  it('로그인 제목이 렌더된다', () => {
    render(<LoginPage />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { name: /로그인/i })).toBeInTheDocument();
  });

  it('LoginForm이 포함된다 (이메일 input 존재)', () => {
    render(<LoginPage />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
  });
});
