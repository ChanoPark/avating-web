import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

/**
 * 정본 variant 는 components.css `.av-tag` 의 네 가지다.
 * 상태 신호(인증·온라인·생성 완료 등)는 태그가 아니라 `Badge`(`.av-badge`) 가 맡는다.
 */
type TagVariant = 'default' | 'neutral' | 'ruby' | 'outline';

const variants: Record<TagVariant, string> = {
  default: 'bg-primary-wash text-primary-press',
  neutral: 'bg-canvas-soft text-ink-mute',
  ruby: 'bg-danger-wash text-danger',
  outline: 'border-hairline border bg-transparent text-ink-mute',
};

// `.av-tag` — 부드러운 대문자 eyebrow / 라벨 pill. 테두리는 outline 만 갖는다.
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
