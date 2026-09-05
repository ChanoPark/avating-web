import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

// components.css `.av-btn`. 테두리 색은 base 가 아니라 variant 가 갖는다 — `cn` 은
// tailwind-merge 가 아닌 단순 join이라 base 와 variant 에 같은 성격의 border 색 클래스를
// 두면 스타일시트 순서가 승자를 정한다. 실제로 secondary 의 파란 테두리가 사라져 ghost 처럼
// 보인 적이 있다. 폭은 base 가 공유한다.
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

// 아이콘 버튼은 패딩 대신 고정 폭을 쓴다 — 함께 두면 Tailwind shorthand/longhand 순서에
// 따라 결과가 갈려서 배타적으로 골라 쓴다.
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
