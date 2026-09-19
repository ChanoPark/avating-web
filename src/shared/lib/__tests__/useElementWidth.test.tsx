import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useElementWidth } from '../useElementWidth';

function Probe() {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="probe">
      {width}
    </div>
  );
}

describe('useElementWidth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('처음 그릴 때 요소 폭을 잰다 (paint 전에 재서 첫 화면부터 맞는 크기로 그린다)', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 320,
    } as DOMRect);
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('320');
  });

  it('요소 크기가 바뀌면 새 폭을 돌려준다', () => {
    let notify: ResizeObserverCallback = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      }
    );
    render(<Probe />);

    act(() => {
      notify([{ contentRect: { width: 480 } } as ResizeObserverEntry], {} as ResizeObserver);
    });
    expect(screen.getByTestId('probe')).toHaveTextContent('480');
  });

  it('ResizeObserver 가 없는 환경에서도 깨지지 않는다', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('0');
  });
});
