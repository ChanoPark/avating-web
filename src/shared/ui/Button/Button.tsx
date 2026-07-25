import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

// Height comes from padding + line-height (no fixed h-*), matching the design
// system's padding-based sizing (06-components Sizes table).
const base =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border border-transparent font-ui leading-none cursor-pointer ' +
  'transition-colors duration-[var(--duration-fast)] ease-[var(--ease)] ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white border-brand hover:bg-brand-hover hover:border-brand-hover',
  secondary: 'bg-bg-elev-2 text-text border-border-hi hover:bg-bg-elev-3 hover:border-border-focus',
  ghost: 'bg-transparent text-text-2 hover:bg-bg-elev-2 hover:text-text',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-body-sm',
  md: 'px-3.5 py-2 text-ui',
  lg: 'px-[18px] py-2.5 text-body',
  icon: 'h-8 w-8 p-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
