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

  it('active=true 시 흰 서피스 + 파란 테두리 + inset 링이 적용된다 (틴트 채움 아님)', () => {
    render(<FilterChip label="온라인" active onToggle={vi.fn()} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    expect(chip.className).toContain('bg-surface');
    expect(chip.className).toContain('border-primary');
    expect(chip.className).toContain('text-primary-press');
    expect(chip.className).toContain('shadow-[inset_0_0_0_1px_var(--primary)]');
  });

  it('높이 30px · pill · 13px 미디엄 타입을 갖는다', () => {
    render(<FilterChip label="온라인" active={false} onToggle={vi.fn()} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    expect(chip.className).toContain('h-7.5');
    expect(chip.className).toContain('rounded-pill');
    expect(chip.className).toContain('text-caption');
    expect(chip.className).toContain('font-medium');
  });

  it('비활성도 흰 서피스 + hairline 테두리를 유지한다', () => {
    render(<FilterChip label="온라인" active={false} onToggle={vi.fn()} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    expect(chip.className).toContain('bg-surface');
    expect(chip.className).toContain('border-hairline');
  });

  it('focus-visible 포커스 링을 갖는다', () => {
    render(<FilterChip label="온라인" active={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: '온라인' }).className).toContain(
      'focus-visible:shadow-focus'
    );
  });

  it('active=false 시 비활성 스타일(브랜드 채움 미적용)', () => {
    render(<FilterChip label="온라인" active={false} onToggle={vi.fn()} />);
    const chip = screen.getByRole('button', { name: '온라인' });
    const hasBrandStyle =
      chip.className.includes('bg-primary') || chip.className.includes('bg-primary-wash');
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
