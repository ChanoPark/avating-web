import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

// 상태 신호(인증·온라인 등)는 Tag 가 아니라 Badge 가 맡는다 — 여기에 추가하지 않는다.
type TagVariant = 'default' | 'neutral' | 'ruby' | 'outline';

const variants: Record<TagVariant, string> = {
  default: 'bg-primary-wash text-primary-press',
  neutral: 'bg-canvas-soft text-ink-mute',
  ruby: 'bg-danger-wash text-danger',
  outline: 'border-hairline border bg-transparent text-ink-mute',
};

export function Tag({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: TagVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-micro-cap rounded-pill inline-flex items-center gap-1.25 px-2.25 py-1 tracking-[0.06em] uppercase',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
