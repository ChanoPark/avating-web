import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

type CardProps = {
  children: ReactNode;
  /** 강조는 틴트 채움이 아니라 흰 서피스 + 파란 테두리로 구분한다. */
  featured?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function Card({ children, featured = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface shadow-card rounded-lg border',
        featured ? 'border-primary' : 'border-hairline',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
