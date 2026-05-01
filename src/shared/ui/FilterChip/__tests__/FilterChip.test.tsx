import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChip } from '../FilterChip';

describe('FilterChip', () => {
  it('label 이 렌더된다', () => {
    render(<FilterChip label="온라인" active={false} onToggle={vi.fn()} />);
    expect(screen.getByText('온라인')).toBeInTheDocument();
  });

  it('active=false 시 aria-pressed="false" 이다', () => {
    render(<FilterChip label="온라인" active={false} onToggle={vi.fn()} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('active=true 시 aria-pressed="true" 이다', () => {
    render(<FilterChip label="온라인" active onToggle={vi.fn()} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('active=true 시 brand 토큰 클래스가 적용된다', () => {
    render(<FilterChip label="온라인" active onToggle={vi.fn()} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    const hasActiveStyle =
      chip.className.includes('text-brand') ||
      chip.className.includes('bg-brand') ||
      chip.className.includes('border-brand') ||
      chip.className.includes('active');
    expect(hasActiveStyle).toBe(true);
  });

  it('active=false 시 비활성 스타일(brand 미적용)', () => {
    render(<FilterChip label="온라인" active={false} onToggle={vi.fn()} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    const hasBrandStyle =
      chip.className.includes('text-brand') || chip.className.includes('bg-brand-soft');
    expect(hasBrandStyle).toBe(false);
  });

  it('클릭 시 onToggle 이 호출된다', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<FilterChip label="온라인" active={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: '온라인' }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('키보드 Enter 로 토글된다', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<FilterChip label="온라인" active={false} onToggle={onToggle} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    chip.focus();
    await user.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalled();
  });

  it('키보드 Space 로 토글된다', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<FilterChip label="온라인" active={false} onToggle={onToggle} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    chip.focus();
    await user.keyboard(' ');
    expect(onToggle).toHaveBeenCalled();
  });
});
