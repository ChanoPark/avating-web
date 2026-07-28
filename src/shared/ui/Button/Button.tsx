import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 폭 100% — `.av-btn--block` */
  block?: boolean;
  /** 정사각 아이콘 버튼 — `.av-btn--icon` (좌우 패딩 대신 높이와 같은 폭) */
  icon?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

// components.css `.av-btn` — pill · 고정 높이 · line-height 1 · weight 500.
// 밴드당 채워진 파란 CTA 는 하나만 (primary 는 아껴 쓴다).
// 테두리 **색**은 base 가 아니라 variant 가 갖는다. `cn` 은 tailwind-merge 가 아니라
// 단순 join 이라 base 의 `border-transparent` 와 variant 의 `border-primary` 가 함께
// 남고, 승자를 스타일시트 방출 순서가 정한다 — 실제로 secondary 의 파란 테두리가
// 사라져 ghost 처럼 보이고 있었다. 폭(`border`)만 공유한다.
const base = cn(
  'inline-flex items-center justify-center rounded-pill border',
  'cursor-pointer leading-none font-medium whitespace-nowrap select-none',
  'transition-[background-color,border-color,color,transform,filter]',
  'duration-[var(--dur-fast)] ease-brand',
  'focus-visible:shadow-focus focus-visible:outline-none',
  'enabled:active:translate-y-[0.5px]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-primary text-on-primary enabled:hover:bg-primary-hover enabled:active:bg-primary-press',
  // 강조는 틴트 채움이 아니라 흰 서피스 + 파란 테두리다.
  secondary: 'border-primary bg-surface text-primary enabled:hover:bg-primary-wash',
  ghost:
    'border-transparent bg-transparent text-ink-secondary enabled:hover:bg-canvas-soft enabled:hover:text-ink',
  dark: 'border-transparent bg-brand-dark text-white enabled:hover:brightness-[1.14]',
  danger: 'border-transparent bg-danger text-white enabled:hover:brightness-[1.06]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 text-body-sm',
  md: 'h-10 gap-2 text-body',
  lg: 'h-12 gap-2 text-body-lg',
};

// 텍스트 버튼은 좌우 패딩으로, 아이콘 버튼은 높이와 같은 고정 폭으로 넓이가 정해진다.
// 둘을 함께 붙이면 Tailwind 의 shorthand/longhand 순서에 따라 결과가 갈리므로 배타적으로 고른다.
const paddings: Record<ButtonSize, string> = {
  sm: 'px-3.5',
  md: 'px-4.5',
  lg: 'px-6.5',
};

const iconWidths: Record<ButtonSize, string> = {
  sm: 'w-8',
  md: 'w-10',
  lg: 'w-12',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  icon = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        icon ? iconWidths[size] : paddings[size],
        block && 'flex w-full',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
