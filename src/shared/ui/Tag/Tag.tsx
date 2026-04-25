import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

type TagVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger';

const variants: Record<TagVariant, string> = {
  default: 'bg-bg-elev-3 border-border text-text-2',
  brand: 'bg-brand-soft border-brand-border text-brand',
  success: 'bg-[rgba(63,185,80,0.1)] border-[rgba(63,185,80,0.3)] text-success',
  warning: 'bg-[rgba(210,153,34,0.1)] border-[rgba(210,153,34,0.3)] text-warning',
  danger: 'bg-[rgba(248,81,73,0.1)] border-[rgba(248,81,73,0.3)] text-danger',
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
        'font-ui text-mono-meta inline-flex items-center rounded-sm border px-2 py-0.5',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
