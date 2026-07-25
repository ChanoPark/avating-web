import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { cn } from '@shared/lib/cn';
import { useSidebarContext } from './sidebarContext';

type SidebarItemProps = {
  icon: LucideIcon;
  label: string;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
  onClick?: (() => void) | undefined;
};

export function SidebarItem({
  icon: Icon,
  label,
  to,
  active = false,
  disabled = false,
  badge,
  onClick,
}: SidebarItemProps) {
  const location = useLocation();
  const { mode } = useSidebarContext();
  const isActive = active || (to !== undefined && location.pathname === to);

  // 아이콘 전용(라벨 숨김)으로 보이는 모드인지 — collapsed 는 항상, responsive 는 md 구간에서.
  const iconOnly = mode === 'collapsed' || mode === 'responsive';

  const layoutClass =
    mode === 'expanded'
      ? 'gap-3 px-3 py-2'
      : mode === 'collapsed'
        ? 'justify-center px-0 py-2.5'
        : // responsive: md 아이콘 전용 → lg 라벨
          'justify-center px-0 py-2.5 lg:justify-start lg:gap-3 lg:px-3 lg:py-2';

  const labelClass =
    mode === 'expanded' ? '' : mode === 'collapsed' ? 'sr-only' : 'sr-only lg:not-sr-only';

  const badgeVisible =
    badge !== undefined && badge > 0 && (mode === 'expanded' || mode === 'responsive');
  const badgeClass = mode === 'responsive' ? 'hidden lg:flex' : 'flex';

  const baseClass = cn(
    'font-ui text-ui flex w-full items-center rounded-sm transition-colors',
    'duration-[var(--duration-fast)] ease-[var(--ease)]',
    layoutClass,
    isActive ? 'bg-bg-elev-2 text-text' : 'text-text-2 hover:bg-bg-elev-2 hover:text-text',
    disabled && 'pointer-events-none opacity-50'
  );

  const content = (
    <>
      <Icon size={16} aria-hidden="true" className={cn(isActive ? 'text-brand' : 'text-text-3')} />
      <span className={labelClass}>{label}</span>
      {badgeVisible && (
        <span
          aria-label={`${badge}개`}
          className={cn(
            'bg-bg-elev-3 text-text-2 ml-auto h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px]',
            badgeClass
          )}
        >
          {badge}
        </span>
      )}
    </>
  );

  // 아이콘 전용으로 보일 수 있는 모드에서는 접근 가능한 이름·툴팁을 라벨로 제공.
  const ariaLabel = iconOnly ? label : undefined;
  const titleAttr = iconOnly ? label : undefined;

  if (disabled || to === undefined) {
    return (
      <div
        role="link"
        aria-disabled="true"
        aria-current={isActive ? 'page' : undefined}
        aria-label={ariaLabel}
        title={titleAttr}
        tabIndex={-1}
        className={baseClass}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      aria-current={isActive ? 'page' : undefined}
      aria-label={ariaLabel}
      title={titleAttr}
      className={baseClass}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}
