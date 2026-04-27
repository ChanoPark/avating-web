import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from '../Card';

describe('Card', () => {
  it('children을 렌더한다', () => {
    render(<Card>카드 콘텐츠</Card>);
    expect(screen.getByText('카드 콘텐츠')).toBeInTheDocument();
  });

  it('elevation=2 prop을 수용한다', () => {
    const { container } = render(<Card elevation={2}>엘리베이션 2</Card>);
    expect(container.firstChild).toBeTruthy();
  });

  it('className prop이 적용된다', () => {
    const { container } = render(<Card className="custom-class">내용</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
