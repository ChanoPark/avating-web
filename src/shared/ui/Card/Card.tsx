import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

type CardProps = {
  children: ReactNode;
  elevation?: 1 | 2;
} & HTMLAttributes<HTMLDivElement>;

export function Card({ children, elevation = 1, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'border-border rounded-md border',
        elevation === 2 ? 'bg-bg-elev-2' : 'bg-bg-elev-1',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
