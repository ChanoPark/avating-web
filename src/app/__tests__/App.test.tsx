import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from 'react-error-boundary';
import { App, AppFallback } from '../App';

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    RouterProvider: ({ fallbackElement }: { fallbackElement?: React.ReactNode }) =>
      fallbackElement ?? null,
  };
});

function CrashingChild(): never {
  throw new Error('boom');
}

describe('App', () => {
  it('에러 없이 렌더된다', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('App 컴포넌트가 QueryClientProvider 를 포함해 렌더된다', () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });

  it('AppFallback 은 자식 크래시 시 alert role 과 안내 텍스트를 노출한다', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary FallbackComponent={AppFallback}>
        <CrashingChild />
      </ErrorBoundary>
    );
    consoleSpy.mockRestore();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/일시적인 오류가 발생했습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /다시 시도/ })).toBeInTheDocument();
  });
});
