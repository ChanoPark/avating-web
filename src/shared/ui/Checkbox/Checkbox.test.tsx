import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('label 과 htmlFor 로 연결되고 클릭하면 체크된다', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Checkbox id="agree" />
        <label htmlFor="agree">동의합니다</label>
      </>
    );
    const box = screen.getByRole('checkbox', { name: '동의합니다' });

    await user.click(screen.getByText('동의합니다'));

    expect(box).toBeChecked();
  });

  // 네이티브 체크박스는 width/height/border 를 무시하고 자기 크기로 그린다 — 그 위에 얹은
  // outline 은 CSS 상자를 따라가서 실제 보이는 네모와 어긋난다. 상자를 직접 그려야 테두리가 맞는다.
  it('`.cx-check__box` 규격 — 네이티브 모양을 끄고 16px 상자를 직접 그린다', () => {
    render(<Checkbox aria-label="동의" />);
    const box = screen.getByRole('checkbox', { name: '동의' });

    expect(box).toHaveClass('appearance-none');
    expect(box).toHaveClass('size-4');
    expect(box).toHaveClass('rounded-chip');
    expect(box).toHaveClass('border-[1.5px]');
    expect(box).toHaveClass('border-field');
    expect(box).toHaveClass('checked:bg-action');
  });

  it('aria-invalid 이면 상자 테두리 자체가 위험색이 된다 — 바깥 outline 을 덧씌우지 않는다', () => {
    render(<Checkbox aria-label="동의" aria-invalid />);
    const box = screen.getByRole('checkbox', { name: '동의' });

    expect(box).toHaveClass('border-danger-mark');
    expect(box).not.toHaveClass('border-field');
    expect(box.className).not.toMatch(/\boutline-/);
  });

  it('disabled 는 비활성 필드 채움과 비활성 경계선이다 (opacity 로 흐리지 않는다)', () => {
    render(<Checkbox aria-label="유지" disabled />);
    const box = screen.getByRole('checkbox', { name: '유지' });

    expect(box).toBeDisabled();
    expect(box).toHaveClass('disabled:bg-field-disabled');
    expect(box).toHaveClass('disabled:border-field-border-disabled');
    expect(box.className).not.toMatch(/opacity/);
  });
});
