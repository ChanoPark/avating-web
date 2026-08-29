import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreditAmount } from '../ui/CreditAmount';
import { InlineErrorPanel } from '../ui/InlineErrorPanel';
import { MemoryRouter } from 'react-router';

describe('CreditAmount', () => {
  it('숫자는 tabular-nums 로, 아이콘은 SVG 로 렌더된다', () => {
    const { container } = render(<CreditAmount amount={30} />);
    expect(screen.getByText('30')).toHaveClass('tnum');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('◇ 문자 글리프를 쓰지 않는다', () => {
    const { container } = render(<CreditAmount amount={248} />);
    expect(container.textContent).not.toContain('◇');
  });

  it('스크린리더에 단위(다이아)가 함께 노출된다', () => {
    render(<CreditAmount amount={30} />);
    expect(screen.getByText('다이아')).toHaveClass('sr-only');
  });
});

describe('InlineErrorPanel', () => {
  it('다이아 부족 안내가 ◇ 없이 Diamond 아이콘 + tnum 으로 표기된다', () => {
    const { container } = render(
      <MemoryRouter>
        <InlineErrorPanel id="err" kind="insufficient-gems" />
      </MemoryRouter>
    );
    expect(screen.getByText('다이아가 부족해요')).toBeInTheDocument();
    expect(screen.getByText('30')).toHaveClass('tnum');
    expect(container.textContent).not.toContain('◇');
  });

  it('네트워크 오류는 흰 서피스 + danger 테두리 패널로 노출된다', () => {
    render(<InlineErrorPanel id="err" kind="network" />);
    const panel = screen.getByRole('alert');
    expect(panel).toHaveClass('bg-surface');
    expect(panel).toHaveClass('border-danger');
  });
});
