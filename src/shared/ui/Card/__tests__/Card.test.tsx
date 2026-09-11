import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from '../Card';

// 정본: `.cx-card` — 면을 가르는 건 선이 아니라 canvas → surface → raised 명도 단차다.
describe('Card', () => {
  it('children을 렌더한다', () => {
    render(<Card>카드 콘텐츠</Card>);
    expect(screen.getByText('카드 콘텐츠')).toBeInTheDocument();
  });

  it('기본 카드는 흰 캔버스 + radius 10 이고, 테두리도 그림자도 없다', () => {
    const { container } = render(<Card>기본</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-canvas');
    expect(card.className).toContain('rounded-card');
    expect(card.className).not.toContain('border-subtle');
    expect(card.className).not.toContain('shadow-');
  });

  it('onWhite=true 일 때만 1px 안쪽 규칙을 갖는다 — 흰 면 위 흰 카드의 가장자리다', () => {
    const { container } = render(<Card onWhite>흰 면 위</Card>);
    expect((container.firstChild as HTMLElement).className).toContain(
      'shadow-[inset_0_0_0_1px_var(--border-subtle)]'
    );
  });

  it('className prop이 적용된다', () => {
    const { container } = render(<Card className="custom-class">내용</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
