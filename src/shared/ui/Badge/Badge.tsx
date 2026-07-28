import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

/**
 * components.css `.av-badge` — 상태 신호용 pill. `.av-tag` 와는 별개 컴포넌트다.
 * badge 는 12px medium · 대문자 변환 없음 · 기본이 canvas-soft + hairline 테두리,
 * tag 는 10.5px semibold · uppercase · 테두리 없음 · 기본이 primary-wash 다.
 */
type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

/**
 * 테두리 색은 base 가 아니라 variant 가 갖는다. `cn` 은 단순 join 이라
 * `border-hairline` 과 `border-transparent` 이 함께 남으면 승자가 스타일시트
 * 순서에 좌우된다. base 는 1px 폭만 두고 색은 variant 마다 하나씩만 붙인다.
 * (modifier 도 `border-color:transparent` 일 뿐 폭은 1px 그대로라 높이가 22 로 유지된다.)
 */
const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-canvas-soft text-ink-secondary border-hairline',
  brand: 'bg-primary-wash text-primary-press border-transparent',
  success: 'bg-success-wash text-success border-transparent',
  warning: 'bg-warning-wash text-warning border-transparent',
  danger: 'bg-danger-wash text-danger border-transparent',
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  /** `.av-badge__dot` — 6px currentColor 원을 children 앞에 붙인다. */
  dot?: boolean;
  className?: string;
};

export function Badge({ children, variant = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'rounded-pill inline-flex h-5.5 items-center gap-1.25 border px-2.25 text-[12px] leading-none font-medium whitespace-nowrap',
        variants[variant],
        className
      )}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}
