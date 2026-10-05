import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

// `_ds/components/cx-components.css` `.cx-btn`. 테두리가 없다 — 버튼은 선이 아니라 톤으로 선다.
// 라벨은 크기와 무관하게 14/600 하나다(컨트롤 라벨이지 본문이 아니다).
const base = cn(
  'inline-flex items-center justify-center gap-2 rounded-card border-0',
  'text-btn cursor-pointer whitespace-nowrap select-none',
  'transition-[background-color,color] duration-[var(--dur-fast)] ease-standard',
  // 비활성은 opacity 가 아니라 색 토큰이다 — opacity 는 뒤에 깔린 것과 섞여 대비비를 말할 수 없게 만든다.
  'disabled:bg-raised disabled:text-muted disabled:pointer-events-none'
);

const variants: Record<ButtonVariant, string> = {
  // 기본 CTA 는 검정이다. 파랑이 아니다.
  primary: 'bg-ink text-on-ink enabled:hover:bg-ink-hover enabled:active:bg-ink-press',
  // 시스템에서 유일한 파란 채움 — 흐름의 진입 CTA 하나에만 쓴다.
  brand: 'bg-action text-on-action enabled:hover:bg-action-hover enabled:active:bg-action-press',
  // 무채색 약한 채움. 파란 테두리가 아니다.
  secondary:
    'bg-fill-weak text-primary enabled:hover:bg-fill-weak-hover enabled:active:bg-fill-weak-press',
  ghost:
    'bg-transparent text-secondary enabled:hover:bg-surface enabled:hover:text-primary enabled:active:bg-fill-weak disabled:bg-transparent',
  // 파괴적 액션은 텍스트다. 빨간 채움은 확인 다이얼로그의 primary 슬롯에만 존재한다.
  danger: 'bg-transparent text-danger enabled:hover:bg-danger-tint disabled:bg-transparent',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-11',
};

// 아이콘 버튼은 패딩 대신 고정 폭을 쓴다 — 함께 두면 Tailwind shorthand/longhand 순서에
// 따라 결과가 갈려서 배타적으로 골라 쓴다.
const paddings: Record<ButtonSize, string> = {
  sm: 'px-3',
  md: 'px-4',
  lg: 'px-5',
};

const iconWidths: Record<ButtonSize, string> = {
  sm: 'w-8',
  md: 'w-10',
  lg: 'w-11',
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
        block ? 'flex w-full' : null,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
