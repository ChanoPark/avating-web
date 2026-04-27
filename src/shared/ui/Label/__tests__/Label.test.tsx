import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MonoLabel } from '../Label';

describe('MonoLabel', () => {
  it('children을 렌더한다', () => {
    render(<MonoLabel>누적 매칭</MonoLabel>);
    expect(screen.getByText('누적 매칭')).toBeInTheDocument();
  });

  it('className prop이 적용된다', () => {
    const { container } = render(<MonoLabel className="extra-class">레이블</MonoLabel>);
    expect(container.firstChild).toHaveClass('extra-class');
  });
});
