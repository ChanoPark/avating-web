import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AvatarTagBadge } from '../AvatarTagBadge';

describe('AvatarTagBadge', () => {
  it('해시태그를 # 을 붙여 보여준다', () => {
    render(<AvatarTagBadge hashtag="A3K9Z7" />);
    expect(screen.getByText('#A3K9Z7')).toBeInTheDocument();
  });

  // 아바타 색과 상관없이 정본 .cx-atag 의 연한 회색 면이다 (사용자 결정 2026-09-25).
  it('배경은 연한 회색(--bg-surface), 글자는 보조색이다', () => {
    render(<AvatarTagBadge hashtag="A3K9Z7" />);
    const badge = screen.getByText('#A3K9Z7');
    expect(badge).toHaveClass('bg-surface', 'text-secondary');
    expect(badge.className).not.toMatch(/\bbg-id-/);
  });

  it('20px pill 이다 (정본 .cx-atag)', () => {
    render(<AvatarTagBadge hashtag="A3K9Z7" />);
    expect(screen.getByText('#A3K9Z7')).toHaveClass('h-5', 'rounded-full', 'px-2');
  });
});
