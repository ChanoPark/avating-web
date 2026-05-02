import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

type SidebarProps = {
  children: ReactNode;
  collapsed?: boolean;
};

export function Sidebar({ children, collapsed = false }: SidebarProps) {
  return (
    <nav
      aria-label="메인 내비게이션"
      data-collapsed={collapsed}
      className={cn(
        'border-border bg-bg h-full shrink-0 flex-col border-r',
        'hidden min-[860px]:flex min-[860px]:w-16 lg:w-[220px]'
      )}
    >
      {children}
    </nav>
  );
}
