import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../Badge';

// 정본: `.cx-badge` + `.cx-status` — 배지는 시스템이 알려주는 상태라 **무채색**이다.
// success·warning 색은 Codex 에 없고, 상태는 색이 아니라 마크의 모양으로 나뉜다.
describe('Badge', () => {
  it('children을 렌더한다', () => {
    render(<Badge>인증</Badge>);
    expect(screen.getByText('인증')).toBeInTheDocument();
  });

  it('20px 고정 높이 · 8px 좌우 패딩 · 13px medium · pill 이다', () => {
    render(<Badge>인증</Badge>);
    const badge = screen.getByText('인증');
    expect(badge.className).toContain('h-5');
    expect(badge.className).toContain('px-2');
    expect(badge.className).toContain('text-caption');
    expect(badge.className).toContain('font-medium');
    expect(badge.className).toContain('leading-5');
    expect(badge.className).toContain('rounded-full');
  });

  it('대문자 + caps 자간을 쓴다', () => {
    render(<Badge>인증</Badge>);
    const badge = screen.getByText('인증');
    expect(badge.className).toContain('uppercase');
    expect(badge.className).toContain('tracking-[var(--ls-caps)]');
  });

  it('기본(neutral)은 raised 채움 + secondary 텍스트이고 테두리가 없다', () => {
    render(<Badge>대기</Badge>);
    const badge = screen.getByText('대기');
    expect(badge.className).toContain('bg-raised');
    expect(badge.className).toContain('text-secondary');
    expect(badge.className).not.toContain('border');
  });

  it.each([
    ['count', 'bg-count', 'text-count-text'],
    ['strong', 'bg-count-strong', 'text-count-strong-text'],
    ['alert', 'bg-danger-tint', 'text-danger'],
  ] as const)('variant="%s" 는 %s 채움 + %s 텍스트다', (variant, bg, text) => {
    render(<Badge variant={variant}>라벨</Badge>);
    const badge = screen.getByText('라벨');
    expect(badge.className).toContain(bg);
    expect(badge.className).toContain(text);
  });

  it('variant="outline" 은 투명 배경 + 1px 안쪽 규칙이다', () => {
    render(<Badge variant="outline">인증</Badge>);
    const badge = screen.getByText('인증');
    expect(badge.className).toContain('bg-transparent');
    expect(badge.className).toContain('shadow-[inset_0_0_0_1px_var(--border-subtle)]');
  });

  it('어떤 variant 에도 success·warning 색이 남아 있지 않다', () => {
    render(<Badge variant="count">라벨</Badge>);
    const cls = screen.getByText('라벨').className;
    expect(cls).not.toContain('success');
    expect(cls).not.toContain('warning');
  });

  describe('mark — 상태는 색이 아니라 모양이다', () => {
    it('mark="active" 는 채워진 9px 원이다', () => {
      render(<Badge mark="active">온라인</Badge>);
      const dot = screen.getByText('온라인').firstElementChild;
      expect(dot?.className).toContain('h-[9px]');
      expect(dot?.className).toContain('w-[9px]');
      expect(dot?.className).toContain('rounded-full');
      expect(dot?.className).toContain('bg-current');
    });

    it('mark="idle" 은 채움 없는 링이다', () => {
      render(<Badge mark="idle">오프라인</Badge>);
      const dot = screen.getByText('오프라인').firstElementChild;
      expect(dot?.className).toContain('bg-transparent');
      expect(dot?.className).toContain('border-strong');
    });

    it('mark="running" 은 맥동한다', () => {
      render(<Badge mark="running">매칭 중</Badge>);
      expect(screen.getByText('매칭 중').firstElementChild?.className).toContain(
        'motion-safe:animate-pulse'
      );
    });

    it('mark 는 장식이라 접근성 트리에서 감춘다', () => {
      render(<Badge mark="active">온라인</Badge>);
      expect(screen.getByText('온라인').firstElementChild).toHaveAttribute('aria-hidden', 'true');
    });

    it('기본값은 mark 없음이다', () => {
      render(<Badge>인증</Badge>);
      expect(screen.getByText('인증').querySelector('.rounded-full')).toBeNull();
    });
  });

  it('아이콘 자식을 받는다', () => {
    render(
      <Badge variant="outline">
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
