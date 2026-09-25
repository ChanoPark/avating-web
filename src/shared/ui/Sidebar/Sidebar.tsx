import { useMemo, type ReactNode } from 'react';
import { cn } from '@shared/lib/cn';
import { SidebarContextProvider, type SidebarMode } from './sidebarContext';

type SidebarProps = {
  children: ReactNode;
  collapsed?: boolean;
  className?: string;
};

export function Sidebar({ children, collapsed = false, className }: SidebarProps) {
  const mode: SidebarMode = collapsed ? 'collapsed' : 'expanded';
  const ctx = useMemo(() => ({ mode }), [mode]);

  const layoutClass = mode === 'collapsed' ? 'flex w-14' : 'flex w-60';

  return (
    <SidebarContextProvider value={ctx}>
      <nav
        aria-label="메인 내비게이션"
        data-collapsed={collapsed}
        data-sidebar-mode={mode}
        className={cn(
          'border-subtle bg-canvas h-full shrink-0 flex-col border-r',
          layoutClass,
          className
        )}
      >
        {children}
      </nav>
    </SidebarContextProvider>
  );
}
