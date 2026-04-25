import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from './Toast';
import { useToast } from './useToast';

function wrap({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('Toast', () => {
  it('renders a toast when show() is called', () => {
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({
        variant: 'error',
        title: '이메일 중복',
        description: '이미 가입된 이메일입니다.',
        durationMs: 0,
      });
    });
    expect(screen.getByText('이메일 중복')).toBeInTheDocument();
    expect(screen.getByText('이미 가입된 이메일입니다.')).toBeInTheDocument();
  });

  it('removes a toast when dismiss() is called', () => {
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    let id = '';
    act(() => {
      id = result.current.show({
        variant: 'success',
        title: '아바타 생성 완료',
        durationMs: 0,
      });
    });
    expect(screen.getByText('아바타 생성 완료')).toBeInTheDocument();
    act(() => {
      result.current.dismiss(id);
    });
    expect(screen.queryByText('아바타 생성 완료')).not.toBeInTheDocument();
  });

  it('throws when used outside ToastProvider', () => {
    expect(() => render(<HookProbe />)).toThrowError(/ToastProvider/);
  });
});

function HookProbe() {
  useToast();
  return null;
}
