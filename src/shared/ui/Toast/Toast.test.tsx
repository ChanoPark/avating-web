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

  // 정본 S-11-07 — 에러·주의 토스트는 자동 소멸하지 않는다(닫기 버튼으로만).
  it('error 토스트는 durationMs 를 주지 않으면 자동으로 사라지지 않는다', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({ variant: 'error', title: '요청을 보내지 못했어요' });
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('요청을 보내지 못했어요')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('warning 토스트도 자동으로 사라지지 않는다', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({ variant: 'warning', title: '권한이 없어요' });
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('권한이 없어요')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('success 토스트는 기본 3초 뒤 사라진다', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({ variant: 'success', title: '아바타 생성 완료' });
    });
    expect(screen.getByText('아바타 생성 완료')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.queryByText('아바타 생성 완료')).not.toBeInTheDocument();
    vi.useRealTimers();
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

    act(() => {
      fireEvent.mouseLeave(toast as HTMLElement);
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.queryByText('호버 일시정지')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  // 어떤 토스트인지는 글리프가 말한다 — 좌측 컬러 레일도, 톤 배지도 없다.
  it.each([
    ['info', 'text-secondary'],
    ['success', 'text-secondary'],
    ['warning', 'text-secondary'],
    ['error', 'text-danger'],
  ] as const)('variant="%s" 이면 마크 색이 %s 다', (variant, markClass) => {
    const { result } = renderHook(() => useToast(), { wrapper: wrap });
    act(() => {
      result.current.show({ variant, title: '톤 확인', durationMs: 0 });
    });
    const toast = screen.getByText('톤 확인').closest('[role="status"]');
    expect(toast?.querySelector('span')?.className).toContain(markClass);
    // 컨테이너에 톤 색이 붙지 않는다: 흰 캔버스 + hairline 하나다.
    expect(toast?.className).toContain('bg-canvas');
    expect(toast?.className).not.toContain('border-l-');
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
