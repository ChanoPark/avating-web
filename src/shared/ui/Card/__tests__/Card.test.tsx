import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from '../Card';

describe('Card', () => {
  it('children을 렌더한다', () => {
    render(<Card>카드 콘텐츠</Card>);
    expect(screen.getByText('카드 콘텐츠')).toBeInTheDocument();
  });

  it('기본 카드는 흰 서피스 + hairline + shadow-card + rounded-lg 다', () => {
    const { container } = render(<Card>기본</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-surface');
    expect(card.className).toContain('border-hairline');
    expect(card.className).toContain('shadow-card');
    expect(card.className).toContain('rounded-lg');
  });

  it('featured=true 면 파란 테두리로 강조한다 (틴트 채움 없음)', () => {
    const { container } = render(<Card featured>강조 카드</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-primary');
    expect(card.className).not.toContain('bg-primary');
  });

  it('className prop이 적용된다', () => {
    const { container } = render(<Card className="custom-class">내용</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
