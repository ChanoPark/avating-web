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
    'text-caption flex w-full items-center rounded-card transition-colors',
    'duration-[var(--dur-fast)] ease-standard',
    layoutClass,
    // 활성은 시스템이 알려주는 위치라 무채색이다 — 파란 틴트도, 파란 글자도 아니다.
    // .cx-rail__item--active 처럼 잉크 + 굵기가 활성을 나른다.
    isActive
      ? 'bg-raised text-ink font-semibold'
      : 'text-secondary bg-transparent font-normal hover:bg-surface hover:text-primary',
    disabled && 'pointer-events-none opacity-50'
  );

  const content = (
    <>
      {/* 아이콘 색은 항목 텍스트 색을 따른다 — 활성 잉크 / 비활성 secondary. */}
      <Icon size={15} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      <span className={labelClass}>{label}</span>
      {badgeVisible && (
        <span
          aria-label={`${badge}개`}
          className={cn(
            'bg-count text-count-text text-meta tnum ml-auto h-4.5 items-center justify-center rounded-full px-1.75',
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
