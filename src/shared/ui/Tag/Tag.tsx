import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

// `.cx-tag` — 테두리 없는 채움 칩이다. 칩은 톤 위에 앉고, 선택은 잉크 채움이다.
// 옛 파란 틴트 선택 상태는 없어졌다 — 파랑은 흐름당 하나뿐인 Brand 버튼 몫이다.
// 상태 신호(인증·온라인 등)는 Tag 가 아니라 Badge 가 맡는다 — 여기에 추가하지 않는다.
type TagVariant = 'default' | 'onSurface' | 'selected' | 'alert';
/** md = `.cx-tag`(28px). sm = 이름 옆 메타 칩용 인라인 pill(--line-pill 20px). */
type TagSize = 'md' | 'sm';

const variants: Record<TagVariant, string> = {
  default: 'bg-surface text-primary',
  // 회색 판 위에서는 칩이 판에 묻히므로 한 단 위인 흰색으로 뒤집는다.
  onSurface: 'bg-canvas text-primary',
  selected: 'bg-ink text-on-ink',
  alert: 'bg-danger-tint text-danger',
};

// 비활성 컨트롤 안의 칩 — 판은 그대로 두고 색만 내린다 (`.cx-pick[disabled] .cx-tag`).
// variant 와 한 자리를 다투게 두면 `cn` 이 단순 join 이라 둘 다 emit 돼 순서에 운을 건다.
const DISABLED = 'bg-surface text-disabled';

const sizes: Record<TagSize, string> = {
  md: 'text-caption h-7 gap-2 px-3',
  sm: 'text-meta h-5 gap-1.5 px-2',
};

export function Tag({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
}: {
  children: ReactNode;
  variant?: TagVariant;
  size?: TagSize;
  /** 비활성 컨트롤 안에 놓였을 때 — 칩 자체는 클릭 대상이 아니라 색만 내린다. */
  disabled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex flex-none items-center rounded-full font-medium whitespace-nowrap',
        sizes[size],
        disabled ? DISABLED : variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
