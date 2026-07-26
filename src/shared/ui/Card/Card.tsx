import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

type CardProps = {
  children: ReactNode;
  /** 강조 카드 — 틴트 채움이 아니라 흰 서피스 + 파란 테두리로 구분한다. */
  featured?: boolean;
} & HTMLAttributes<HTMLDivElement>;

// 회색 캔버스 위의 부양감은 흰 서피스 + hairline + 아주 옅은 중립 그림자에서 나온다
// (effects.css `--shadow-card`). radius 는 `--r-lg`(12).
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
