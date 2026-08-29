import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

// components.css `.av-badge` — 상태 신호용 pill이다. `.av-tag` 와는 별개 컴포넌트다.
type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

// 테두리 색은 base 가 아니라 variant 가 갖는다. `cn` 은 tailwind-merge 가 아닌 단순 join이라
// base 와 variant 에 같은 성격의 border 색 클래스를 두면 스타일시트 순서가 승자를 정한다.
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
