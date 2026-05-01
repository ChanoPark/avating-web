import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { cn } from '@shared/lib/cn';

type SidebarItemProps = {
  icon: LucideIcon;
  label: string;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
  onClick?: () => void;
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
  const isActive = active || (to !== undefined && location.pathname === to);

  const baseClass = cn(
    'font-ui text-ui flex w-full items-center gap-3 rounded-sm px-3 py-2 transition-colors',
    'duration-[var(--duration-fast)] ease-[var(--ease)]',
    isActive ? 'bg-bg-elev-2 text-text' : 'text-text-2 hover:text-text',
    disabled && 'pointer-events-none opacity-50'
  );

  const content = (
    <>
      <Icon size={16} aria-hidden="true" className={cn(isActive ? 'text-brand' : 'text-text-3')} />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          aria-label={`${badge}개`}
          className="bg-brand ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] text-white"
        >
          {badge}
        </span>
      )}
    </>
  );

  if (disabled || to === undefined) {
    return (
      <div
        role="link"
        aria-disabled="true"
        aria-current={isActive ? 'page' : undefined}
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
      className={baseClass}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}
