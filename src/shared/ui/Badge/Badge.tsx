import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

// `.cx-badge` — 상태 신호용 pill이다. `.cx-tag` 와는 별개 컴포넌트다.
// 배지는 시스템이 알려주는 상태라서 무채색이다. success·warning 색은 Codex 에 없다.
type BadgeVariant = 'neutral' | 'count' | 'strong' | 'outline' | 'alert';

// `.cx-status__mark` — 상태는 색이 아니라 **모양**으로 나뉜다.
type BadgeMark = 'idle' | 'active' | 'running';

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-raised text-secondary',
  count: 'bg-count text-count-text',
  strong: 'bg-count-strong text-count-strong-text',
  outline: 'bg-transparent text-secondary shadow-[inset_0_0_0_1px_var(--border-subtle)]',
  alert: 'bg-danger-tint text-danger',
};

const marks: Record<BadgeMark, string> = {
  idle: 'border-strong border-[1.5px] bg-transparent',
  active: 'bg-current',
  running: 'bg-current motion-safe:animate-pulse',
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  mark?: BadgeMark;
  className?: string;
};

export function Badge({ children, variant = 'neutral', mark, className }: BadgeProps) {
  return (
    <span
      className={cn(
        // 배지가 붙은 줄과 붙지 않은 줄의 높이가 같아야 해서 높이·행간을 못박는다.
        'text-caption tracking-[var(--ls-caps)]',
        'inline-flex h-5 flex-none items-center gap-1 rounded-full px-2 leading-5 font-medium whitespace-nowrap uppercase',
        variants[variant],
        className
      )}
    >
      {mark !== undefined && (
        <span
          aria-hidden="true"
          className={cn('h-[9px] w-[9px] shrink-0 rounded-full', marks[mark])}
        />
      )}
      {children}
    </span>
  );
}
