import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tag } from '../Tag';

// 정본: `.cx-tag` — 테두리 없는 채움 칩. 선택은 파란 틴트가 아니라 잉크 채움이다.
describe('Tag', () => {
  it('children을 렌더한다', () => {
    render(<Tag>BETA</Tag>);
    expect(screen.getByText('BETA')).toBeInTheDocument();
  });

  it('기본은 surface 채움 + primary 텍스트 + pill 이고 테두리가 없다', () => {
    render(<Tag>BETA</Tag>);
    const tag = screen.getByText('BETA');
    expect(tag.className).toContain('bg-surface');
    expect(tag.className).toContain('text-primary');
    expect(tag.className).toContain('rounded-full');
    expect(tag.className).not.toContain('border');
  });

  it('28px 고정 높이 · 13px medium 이고 eyebrow 대문자 타입이 아니다', () => {
    render(<Tag>BETA</Tag>);
    const tag = screen.getByText('BETA');
    expect(tag.className).toContain('h-7');
    expect(tag.className).toContain('text-caption');
    expect(tag.className).not.toContain('uppercase');
  });

  it('variant="selected" 는 잉크 채움이다 — 파란 틴트가 아니다', () => {
    render(<Tag variant="selected">선택됨</Tag>);
    const tag = screen.getByText('선택됨');
    expect(tag.className).toContain('bg-ink');
    expect(tag.className).toContain('text-on-ink');
    expect(tag.className).not.toContain('bg-action-tint');
  });

  it('variant="onSurface" 는 회색 판 위에서 흰색으로 뒤집힌다', () => {
    render(<Tag variant="onSurface">관심사</Tag>);
    expect(screen.getByText('관심사').className).toContain('bg-canvas');
  });

  it('variant="alert" 는 위험 틴트 채움이다', () => {
    render(<Tag variant="alert">거절</Tag>);
    expect(screen.getByText('거절').className).toContain('bg-danger-tint');
  });
});
