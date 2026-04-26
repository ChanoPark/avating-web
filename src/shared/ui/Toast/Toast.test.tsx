import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
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

  it('닫기 버튼을 클릭하면 토스트가 사라진다', async () => {
    const user = userEvent.setup();
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({
        variant: 'info',
        title: '알림 메시지',
        durationMs: 0,
      });
    });
    expect(screen.getByText('알림 메시지')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '알림 닫기' }));
    expect(screen.queryByText('알림 메시지')).not.toBeInTheDocument();
  });

  it('durationMs 이후에 자동으로 토스트가 사라진다', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({
        variant: 'success',
        title: '자동 사라짐',
        durationMs: 1000,
      });
    });
    expect(screen.getByText('자동 사라짐')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.queryByText('자동 사라짐')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('description 없이도 토스트가 렌더된다', () => {
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({
        variant: 'warning',
        title: '경고',
        durationMs: 0,
      });
    });
    expect(screen.getByText('경고')).toBeInTheDocument();
  });
});

function HookProbe() {
  useToast();
  return null;
}
