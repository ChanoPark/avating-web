import { useMemo, type ReactNode } from 'react';
import { cn } from '@shared/lib/cn';
import { SidebarContextProvider } from './sidebarContext';

type SidebarProps = {
  children: ReactNode;
  collapsed?: boolean;
};

export function Sidebar({ children, collapsed = false }: SidebarProps) {
  const ctx = useMemo(() => ({ collapsed }), [collapsed]);
  return (
    <SidebarContextProvider value={ctx}>
      <nav
        aria-label="메인 내비게이션"
        data-collapsed={collapsed}
        className={cn(
          'border-border bg-bg flex h-full shrink-0 flex-col border-r',
          collapsed ? 'w-14' : 'w-[220px]'
        )}
      >
        {children}
      </nav>
    </SidebarContextProvider>
  );
}
