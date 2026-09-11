import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

type CardProps = {
  children: ReactNode;
  /** 흰 면 위에 놓이는 카드만 1px 규칙을 갖는다 — 회색 판 위에서는 톤 단차가 곧 가장자리다. */
  onWhite?: boolean;
} & HTMLAttributes<HTMLDivElement>;

// `.cx-card` — 배경은 흰 캔버스, 테두리는 0, radius 10, padding 20.
// 면을 가르는 건 선이 아니라 canvas → surface → raised 명도 단차다.
export function Card({ children, onWhite = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-canvas rounded-card p-5',
        onWhite ? 'shadow-[inset_0_0_0_1px_var(--border-subtle)]' : null,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
