import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tag } from '../Tag';

describe('Tag', () => {
  it('children을 렌더한다', () => {
    render(<Tag>BETA</Tag>);
    expect(screen.getByText('BETA')).toBeInTheDocument();
  });

  // `.av-tag{background:var(--primary-wash);color:var(--primary-press);border-radius:pill}` — 테두리 없음.
  it('기본은 primary-wash 채움 + primary-press 텍스트 + pill 이고 테두리가 없다', () => {
    render(<Tag>BETA</Tag>);
    const tag = screen.getByText('BETA');
    expect(tag.className).toContain('bg-primary-wash');
    expect(tag.className).toContain('text-primary-press');
    expect(tag.className).toContain('rounded-pill');
    expect(tag.className).not.toContain('border-primary');
  });

  it('10.5px semibold 대문자 eyebrow 타입을 쓴다', () => {
    render(<Tag>BETA</Tag>);
    const tag = screen.getByText('BETA');
    expect(tag.className).toContain('text-micro-cap');
    expect(tag.className).toContain('uppercase');
  });

  it('variant="neutral" 은 canvas-soft 채움 + ink-mute 텍스트다', () => {
    render(<Tag variant="neutral">관심사</Tag>);
    const tag = screen.getByText('관심사');
    expect(tag.className).toContain('bg-canvas-soft');
    expect(tag.className).toContain('text-ink-mute');
  });

  it('variant="ruby" 는 위험 wash 채움이다', () => {
    render(<Tag variant="ruby">거절</Tag>);
    expect(screen.getByText('거절').className).toContain('bg-danger-wash');
  });

  it('variant="outline" 은 투명 배경 + hairline 테두리다', () => {
    render(<Tag variant="outline">선택</Tag>);
    const tag = screen.getByText('선택');
    expect(tag.className).toContain('bg-transparent');
    expect(tag.className).toContain('border-hairline');
  });

  // 상태 신호는 `.av-badge` 계약이라 Tag 가 아니라 Badge 가 맡는다 — v1 별칭은 제거됐다.
  it('badge 의 22px 고정 높이 계약을 갖지 않는다', () => {
    render(<Tag>BETA</Tag>);
    expect(screen.getByText('BETA').className).not.toContain('h-5.5');
  });
});
