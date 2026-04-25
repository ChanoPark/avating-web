import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('text-mono-micro text-text-3 font-mono uppercase', className)}>
      {children}
    </span>
  );
}
