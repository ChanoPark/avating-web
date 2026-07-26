import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
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

  it('hover 중에는 자동 사라짐이 일시정지되고, 마우스를 떼면 재개된다', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({ variant: 'info', title: '호버 일시정지', durationMs: 1000 });
    });
    const toast = screen.getByText('호버 일시정지').closest('[role="status"]');
    expect(toast).not.toBeNull();

    // 카운트다운 도중 hover → 일시정지: duration 을 한참 넘겨도 사라지지 않는다.
    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => {
      fireEvent.mouseEnter(toast as HTMLElement);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('호버 일시정지')).toBeInTheDocument();

    // 마우스를 떼면 카운트다운 재개 → duration 후 사라진다.
    act(() => {
      fireEvent.mouseLeave(toast as HTMLElement);
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.queryByText('호버 일시정지')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  // 톤 신호는 좌측 3px 레일 + wash 배지다. v1 의 `border-l-brand`/하드코딩 rgba 는
  // v2 토큰에 존재하지 않아 아무 색도 만들지 못했다.
  it.each([
    ['info', 'border-l-primary', 'bg-primary-wash'],
    ['success', 'border-l-success', 'bg-success-wash'],
    ['warning', 'border-l-warning', 'bg-warning-wash'],
    ['error', 'border-l-danger', 'bg-danger-wash'],
  ] as const)('variant="%s" 이면 %s 레일과 %s 배지를 쓴다', (variant, railClass, badgeClass) => {
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({ variant, title: '톤 확인', durationMs: 0 });
    });
    const toast = screen.getByText('톤 확인').closest('[role="status"]');
    expect(toast?.className).toContain(railClass);
    const badge = toast?.querySelector('span');
    expect(badge?.className).toContain(badgeClass);
    // 틴트 채움에 같은 색 테두리를 겹치지 않는다.
    expect(badge?.className).not.toContain('border-primary');
  });

  it('최대 3개까지만 노출하고 4번째부터는 가장 오래된 토스트를 제거한다', () => {
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({ variant: 'info', title: '토스트 1', durationMs: 0 });
      result.current.show({ variant: 'info', title: '토스트 2', durationMs: 0 });
      result.current.show({ variant: 'info', title: '토스트 3', durationMs: 0 });
      result.current.show({ variant: 'info', title: '토스트 4', durationMs: 0 });
    });
    expect(screen.queryByText('토스트 1')).not.toBeInTheDocument();
    expect(screen.getByText('토스트 2')).toBeInTheDocument();
    expect(screen.getByText('토스트 3')).toBeInTheDocument();
    expect(screen.getByText('토스트 4')).toBeInTheDocument();
  });
});

function HookProbe() {
  useToast();
  return null;
}
