import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

// `.cx-tag` — 테두리 없는 채움 칩이다. 칩은 톤 위에 앉고, 선택은 잉크 채움이다.
// 옛 파란 틴트 선택 상태는 없어졌다 — 파랑은 흐름당 하나뿐인 Brand 버튼 몫이다.
// 상태 신호(인증·온라인 등)는 Tag 가 아니라 Badge 가 맡는다 — 여기에 추가하지 않는다.
type TagVariant = 'default' | 'onSurface' | 'selected' | 'alert';

const variants: Record<TagVariant, string> = {
  default: 'bg-surface text-primary',
  // 회색 판 위에서는 칩이 판에 묻히므로 한 단 위인 흰색으로 뒤집는다.
  onSurface: 'bg-canvas text-primary',
  selected: 'bg-ink text-on-ink',
  alert: 'bg-danger-tint text-danger',
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
        'text-caption inline-flex h-7 flex-none items-center gap-2 rounded-full px-3 font-medium whitespace-nowrap',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
