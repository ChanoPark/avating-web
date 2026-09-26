import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { cn } from '@shared/lib/cn';
import { useSidebarContext } from './sidebarContext';

type SidebarItemProps = {
  /** 없으면 라벨만 그린다. */
  icon?: LucideIcon;
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

  const iconOnly = mode === 'collapsed';

  // 정본 `.hf-navitem{height:36px}` — 높이를 패딩에 맡기면 줄상자를 따라 36.84 / 35px 로 흐른다
  // ("A row's height must never depend on what is inside it" — typography.css).
  const layoutClass = iconOnly ? 'h-9 justify-center px-0' : 'h-9 gap-2.25 px-3';

  const labelClass = iconOnly ? 'sr-only' : '';

  const badgeVisible = badge !== undefined && badge > 0 && !iconOnly;

  const baseClass = cn(
    // 정본 `.hf-navitem` 은 radius-chip(6px) 이다 — card(10px) 가 아니다.
    'text-caption flex w-full items-center rounded-chip transition-colors',
    'duration-[var(--dur-fast)] ease-standard',
    layoutClass,
    // 활성은 시스템이 알려주는 위치라 무채색이다 — 파란 틴트도, 파란 글자도 아니다.
    // .cx-rail__item--active 처럼 잉크 + 굵기가 활성을 나른다.
    // 정본은 disabled 에 opacity 를 쓰지 않는다 — 뒤에 깔린 것과 섞이면 대비비를 말할 수 없다.
    // 색은 한 분기에서만 나온다: 따로 얹으면 `cn` 이 단순 join 이라 두 색이 같이 emit 돼
    // 승자가 Tailwind 출력 순서에 달린다.
    disabled
      ? 'text-disabled pointer-events-none bg-transparent font-normal'
      : isActive
        ? 'bg-raised text-ink font-semibold'
        : 'text-secondary bg-transparent font-normal hover:bg-surface hover:text-primary'
  );

  const content = (
    <>
      {/* 아이콘 색은 항목 텍스트 색을 따른다 — 활성 잉크 / 비활성 secondary. */}
      {Icon !== undefined && (
        <Icon size={15} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      )}
      <span className={labelClass}>{label}</span>
      {badgeVisible && (
        <span
          aria-label={`${badge}개`}
          className="bg-count text-count-text text-meta tnum ml-auto flex h-4.5 items-center justify-center rounded-full px-1.75"
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
