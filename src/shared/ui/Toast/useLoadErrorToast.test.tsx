import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from './Toast';
import { useLoadErrorToast } from './useLoadErrorToast';

const TITLE = '추천 아바타를 불러오지 못했어요';

function Probe({ active }: { active: boolean }) {
  useLoadErrorToast(active, TITLE);
  return null;
}

describe('useLoadErrorToast', () => {
  it('active 인 동안 빨간 에러 토스트를 하나 띄운다', () => {
    render(
      <ToastProvider>
        <Probe active />
      </ToastProvider>
    );

    const toast = screen.getByText(TITLE).closest('[role="status"]');
    expect(toast).toHaveClass('bg-danger-tint', 'border-danger-mark');
    expect(screen.getByText('잠시 후 다시 시도해주세요.')).toBeInTheDocument();
  });

  it('active 가 아니면 토스트를 띄우지 않는다', () => {
    render(
      <ToastProvider>
        <Probe active={false} />
      </ToastProvider>
    );

    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
  });

  it('active 가 풀리면 토스트가 사라진다', () => {
    const { rerender } = render(
      <ToastProvider>
        <Probe active />
      </ToastProvider>
    );
    expect(screen.getByText(TITLE)).toBeInTheDocument();

    rerender(
      <ToastProvider>
        <Probe active={false} />
      </ToastProvider>
    );

    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
  });

  it('화면이 사라지면 토스트도 함께 사라진다', () => {
    const { rerender } = render(
      <ToastProvider>
        <Probe active />
      </ToastProvider>
    );

    rerender(<ToastProvider>{null}</ToastProvider>);

    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
  });

  it('StrictMode 의 effect 이중 실행에서도 토스트는 하나다', () => {
    render(
      <StrictMode>
        <ToastProvider>
          <Probe active />
        </ToastProvider>
      </StrictMode>
    );

    expect(screen.getAllByText(TITLE)).toHaveLength(1);
  });
});
