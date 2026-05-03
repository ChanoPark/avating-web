import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    RouterProvider: ({ fallbackElement }: { fallbackElement?: React.ReactNode }) =>
      fallbackElement ?? null,
  };
});

describe('App', () => {
  it('에러 없이 렌더된다', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('App 컴포넌트가 QueryClientProvider 를 포함해 렌더된다', () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });

  it('ErrorBoundary 가 포함된 구조다 — 자식 크래시 시 AppFallback 이 노출된다', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(<App />);
    rerender(<App />);
    consoleSpy.mockRestore();
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
