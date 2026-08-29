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

  const iconOnly = mode === 'collapsed' || mode === 'responsive';

  const layoutClass =
    mode === 'expanded'
      ? 'gap-2.25 px-3 py-2.25'
      : mode === 'collapsed'
        ? 'justify-center px-0 py-2.5'
        : 'justify-center px-0 py-2.5 lg:justify-start lg:gap-2.25 lg:px-3 lg:py-2.25';

  const labelClass =
    mode === 'expanded' ? '' : mode === 'collapsed' ? 'sr-only' : 'sr-only lg:not-sr-only';

  const badgeVisible =
    badge !== undefined && badge > 0 && (mode === 'expanded' || mode === 'responsive');
  const badgeClass = mode === 'responsive' ? 'hidden lg:flex' : 'flex';

  const baseClass = cn(
    'text-caption flex w-full items-center rounded-md transition-colors',
    'duration-[var(--dur-fast)] ease-brand',
    'focus-visible:shadow-focus focus-visible:outline-none',
    layoutClass,
    isActive
      ? 'bg-primary-wash text-primary font-medium'
      : 'text-ink-mute bg-transparent font-normal hover:bg-canvas-soft hover:text-ink',
    disabled && 'pointer-events-none opacity-50'
  );

  const content = (
    <>
      {/* 아이콘 색은 항목 텍스트 색을 따른다 — 활성 파랑 / 비활성 ink-mute. */}
      <Icon size={15} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      <span className={labelClass}>{label}</span>
      {badgeVisible && (
        <span
          aria-label={`${badge}개`}
          className={cn(
            'bg-primary-wash text-primary-press text-micro tnum rounded-pill ml-auto h-4.5 items-center justify-center px-1.75',
            badgeClass
          )}
        >
          {badge}
        </span>
      )}
    </>
  );

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
