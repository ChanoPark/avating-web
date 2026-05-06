import { describe, it, expect } from 'vitest';
import { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
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
  it('마지막 포커스 가능 요소에서 Tab 누르면 첫 요소로 순환된다', () => {
    const { getByTestId } = render(<TrapHarness active />);
    const last = getByTestId('last');
    const first = getByTestId('first');
    last.focus();
    fireEvent.keyDown(getByTestId('container'), { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('첫 포커스 가능 요소에서 Shift+Tab 누르면 마지막 요소로 순환된다', () => {
    const { getByTestId } = render(<TrapHarness active />);
    const first = getByTestId('first');
    const last = getByTestId('last');
    first.focus();
    fireEvent.keyDown(getByTestId('container'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('컨테이너 외부에 포커스가 있을 때 Tab 누르면 첫 요소로 진입한다', () => {
    const { getByTestId } = render(<TrapHarness active />);
    const outside = getByTestId('outside-before');
    const first = getByTestId('first');
    outside.focus();
    fireEvent.keyDown(getByTestId('container'), { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('컨테이너 외부에 포커스가 있을 때 Shift+Tab 누르면 마지막 요소로 진입한다', () => {
    const { getByTestId } = render(<TrapHarness active />);
    const outside = getByTestId('outside-after');
    const last = getByTestId('last');
    outside.focus();
    fireEvent.keyDown(getByTestId('container'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('중간 요소에서 Tab 키는 기본 동작을 막지 않는다', () => {
    const { getByTestId } = render(<TrapHarness active />);
    const middle = getByTestId('middle');
    middle.focus();
    const event = fireEvent.keyDown(getByTestId('container'), { key: 'Tab' });
    expect(event).toBe(true);
    expect(document.activeElement).toBe(middle);
  });

  it('active=false 면 Tab 키 처리에 개입하지 않는다', () => {
    const { getByTestId } = render(<TrapHarness active={false} />);
    const last = getByTestId('last');
    last.focus();
    fireEvent.keyDown(getByTestId('container'), { key: 'Tab' });
    expect(document.activeElement).toBe(last);
  });

  it('Tab 이외의 키는 무시한다', () => {
    const { getByTestId } = render(<TrapHarness active />);
    const last = getByTestId('last');
    last.focus();
    fireEvent.keyDown(getByTestId('container'), { key: 'Enter' });
    expect(document.activeElement).toBe(last);
  });
});
