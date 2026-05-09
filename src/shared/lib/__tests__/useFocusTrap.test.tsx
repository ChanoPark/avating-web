import { describe, it, expect } from 'vitest';
import { useRef } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFocusTrap } from '../useFocusTrap';

function TrapHarness({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useFocusTrap(active, ref);
  return (
    <div>
      <button type="button" data-testid="outside-before">
        outside-before
      </button>
      <div ref={ref} data-testid="container">
        <button type="button" data-testid="first">
          first
        </button>
        <button type="button" data-testid="middle">
          middle
        </button>
        <button type="button" data-testid="last">
          last
        </button>
      </div>
      <button type="button" data-testid="outside-after">
        outside-after
      </button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('마지막 포커스 가능 요소에서 Tab 누르면 첫 요소로 순환된다', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<TrapHarness active />);
    const last = getByTestId('last');
    const first = getByTestId('first');
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(first);
  });

  it('첫 포커스 가능 요소에서 Shift+Tab 누르면 마지막 요소로 순환된다', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<TrapHarness active />);
    const first = getByTestId('first');
    const last = getByTestId('last');
    first.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
  });

  it('컨테이너 외부에 포커스가 있을 때 Tab 누르면 첫 요소로 진입한다', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<TrapHarness active />);
    const outside = getByTestId('outside-before');
    const first = getByTestId('first');
    outside.focus();
    await user.tab();
    expect(document.activeElement).toBe(first);
  });

  it('컨테이너 외부에 포커스가 있을 때 Shift+Tab 누르면 마지막 요소로 진입한다', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<TrapHarness active />);
    const outside = getByTestId('outside-after');
    const last = getByTestId('last');
    outside.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
  });

  it('중간 요소에서 Tab 키는 다음 요소로 자연스럽게 이동한다', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<TrapHarness active />);
    const middle = getByTestId('middle');
    const last = getByTestId('last');
    middle.focus();
    await user.tab();
    expect(document.activeElement).toBe(last);
  });

  it('active=false 면 마지막 요소에서 Tab 시 컨테이너 밖 요소로 빠져나간다', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<TrapHarness active={false} />);
    const last = getByTestId('last');
    const outsideAfter = getByTestId('outside-after');
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(outsideAfter);
  });

  it('Tab 이외의 키는 무시한다', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<TrapHarness active />);
    const last = getByTestId('last');
    last.focus();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(last);
  });

  it('컨테이너 내부에 포커스 가능 요소가 없으면 트랩이 무효 동작한다', async () => {
    function EmptyHarness() {
      const ref = useRef<HTMLDivElement | null>(null);
      useFocusTrap(true, ref);
      return (
        <div>
          <button type="button" data-testid="outside">
            outside
          </button>
          <div ref={ref} data-testid="container">
            <span>nothing focusable</span>
          </div>
        </div>
      );
    }
    const user = userEvent.setup();
    const { getByTestId } = render(<EmptyHarness />);
    const outside = getByTestId('outside');
    outside.focus();
    await user.tab();
    expect(document.activeElement).not.toBe(outside);
  });

  it('containerRef.current 가 null 이면 안전하게 무시된다', () => {
    function NullRefHarness() {
      const ref = useRef<HTMLElement | null>(null);
      useFocusTrap(true, ref);
      return <div data-testid="root">root</div>;
    }
    expect(() => render(<NullRefHarness />)).not.toThrow();
  });
});
