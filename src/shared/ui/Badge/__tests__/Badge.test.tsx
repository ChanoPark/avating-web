import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('children을 렌더한다', () => {
    render(<Badge>인증</Badge>);
    expect(screen.getByText('인증')).toBeInTheDocument();
  });

  // `.av-badge{height:22;padding:0 9px;font-size:12px;font-weight:500;line-height:1;radius:pill}`
  it('22px 높이 · 9px 좌우 패딩 · 12px medium · line-height 1 · pill 이다', () => {
    render(<Badge>인증</Badge>);
    const badge = screen.getByText('인증');
    expect(badge.className).toContain('h-5.5');
    expect(badge.className).toContain('px-2.25');
    expect(badge.className).toContain('text-[12px]');
    expect(badge.className).toContain('font-medium');
    expect(badge.className).toContain('leading-none');
    expect(badge.className).toContain('rounded-pill');
  });

  // Tag 와 갈리는 지점 — badge 는 대문자로 변환하지 않고 letter-spacing 을 벌리지 않는다.
  it('Tag 의 uppercase eyebrow 타입을 쓰지 않는다', () => {
    render(<Badge>인증</Badge>);
    const badge = screen.getByText('인증');
    expect(badge.className).not.toContain('uppercase');
    expect(badge.className).not.toContain('text-micro-cap');
  });

  // `.av-badge{background:var(--canvas-soft);color:var(--ink-secondary);border:1px solid var(--hairline)}`
  it('기본(neutral)은 canvas-soft 채움 + ink-secondary 텍스트 + hairline 테두리다', () => {
    render(<Badge>대기</Badge>);
    const badge = screen.getByText('대기');
    expect(badge.className).toContain('bg-canvas-soft');
    expect(badge.className).toContain('text-ink-secondary');
    expect(badge.className).toContain('border-hairline');
  });

  it.each([
    ['brand', 'bg-primary-wash', 'text-primary-press'],
    ['success', 'bg-success-wash', 'text-success'],
    ['warning', 'bg-warning-wash', 'text-warning'],
    ['danger', 'bg-danger-wash', 'text-danger'],
  ] as const)('variant="%s" 는 %s 채움 + %s 텍스트다', (variant, bg, text) => {
    render(<Badge variant={variant}>라벨</Badge>);
    const badge = screen.getByText('라벨');
    expect(badge.className).toContain(bg);
    expect(badge.className).toContain(text);
  });

  // modifier 는 `border-color:transparent` 일 뿐 1px 폭은 그대로 — 높이 22 가 variant 마다 어긋나면 안 된다.
  it.each(['brand', 'success', 'warning', 'danger'] as const)(
    'variant="%s" 는 hairline 대신 투명 테두리를 쓰되 1px 폭은 유지한다',
    (variant) => {
      render(<Badge variant={variant}>라벨</Badge>);
      const badge = screen.getByText('라벨');
      expect(badge.className).toContain('border-transparent');
      expect(badge.className).not.toContain('border-hairline');
      expect(badge.className.split(' ')).toContain('border');
    }
  );

  describe('dot', () => {
    // `.av-badge__dot{width:6px;height:6px;border-radius:50%;background:currentColor}`
    it('dot 를 켜면 6px currentColor 원이 children 앞에 붙는다', () => {
      render(
        <Badge variant="success" dot>
          온라인
        </Badge>
      );
      const badge = screen.getByText('온라인');
      const dot = badge.firstElementChild;
      expect(dot).not.toBeNull();
      expect(dot?.className).toContain('h-1.5');
      expect(dot?.className).toContain('w-1.5');
      expect(dot?.className).toContain('rounded-full');
      expect(dot?.className).toContain('bg-current');
    });

    it('dot 는 장식이라 접근성 트리에서 감춘다', () => {
      render(
        <Badge variant="success" dot>
          온라인
        </Badge>
      );
      expect(screen.getByText('온라인').firstElementChild).toHaveAttribute('aria-hidden', 'true');
    });

    it('기본값은 dot 없음이다', () => {
      render(<Badge>인증</Badge>);
      expect(screen.getByText('인증').querySelector('.rounded-full')).toBeNull();
    });
  });

  it('아이콘 자식을 받는다', () => {
    render(
      <Badge variant="brand">
        <svg data-testid="shield" aria-hidden="true" />
        인증
      </Badge>
    );
    expect(screen.getByTestId('shield')).toBeInTheDocument();
    expect(screen.getByText(/인증/)).toBeInTheDocument();
  });

  it('className 을 덧붙일 수 있다', () => {
    render(<Badge className="shrink-0">인증</Badge>);
    expect(screen.getByText('인증').className).toContain('shrink-0');
  });
});
