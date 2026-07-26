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

  // LAYOUT-NUMBERS § AppShell — 내비 항목 padding 9px 12px, 라벨-아이콘 gap 9.
  const layoutClass =
    mode === 'expanded'
      ? 'gap-2.25 px-3 py-2.25'
      : mode === 'collapsed'
        ? 'justify-center px-0 py-2.5'
        : // responsive: md 아이콘 전용 → lg 라벨
          'justify-center px-0 py-2.5 lg:justify-start lg:gap-2.25 lg:px-3 lg:py-2.25';

  const labelClass =
    mode === 'expanded' ? '' : mode === 'collapsed' ? 'sr-only' : 'sr-only lg:not-sr-only';

  const badgeVisible =
    badge !== undefined && badge > 0 && (mode === 'expanded' || mode === 'responsive');
  const badgeClass = mode === 'responsive' ? 'hidden lg:flex' : 'flex';

  // 활성 = `--primary-wash` 배경 + `--primary` 텍스트 + weight 500,
  // 비활성 = 투명 + `--ink-mute` + weight 400 (LAYOUT-NUMBERS § AppShell). radius 8.
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
          // `av-badge av-badge--brand`, height 18, fontSize 11, padding 0 7px, tnum.
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
