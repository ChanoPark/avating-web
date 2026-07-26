import { useMemo, type ReactNode } from 'react';
import { cn } from '@shared/lib/cn';
import { SidebarContextProvider, type SidebarMode } from './sidebarContext';

type SidebarProps = {
  children: ReactNode;
  collapsed?: boolean;
  /** 태블릿(md) 아이콘 전용 → 데스크톱(lg) 220px 라벨로 리플로우 */
  responsive?: boolean;
  className?: string;
};

export function Sidebar({
  children,
  collapsed = false,
  responsive = false,
  className,
}: SidebarProps) {
  const mode: SidebarMode = responsive ? 'responsive' : collapsed ? 'collapsed' : 'expanded';
  const ctx = useMemo(() => ({ mode }), [mode]);

  // responsive 는 모바일(<md)에서 숨김 → 햄버거 드로어로 대체. display 를 모드 클래스에 포함해
  // 베이스의 flex 와 hidden 이 충돌하지 않게 한다.
  // 펼친 폭 232px 는 LAYOUT-NUMBERS § AppShell 의 고정값이다 (w-58 = 14.5rem).
  const layoutClass =
    mode === 'responsive'
      ? 'hidden md:flex md:w-16 lg:w-58'
      : mode === 'collapsed'
        ? 'flex w-14'
        : 'flex w-58';

  return (
    <SidebarContextProvider value={ctx}>
      <nav
        aria-label="메인 내비게이션"
        data-collapsed={collapsed}
        data-sidebar-mode={mode}
        className={cn(
          // 사이드바는 흰 서피스 + 우측 1px hairline (LAYOUT-NUMBERS § AppShell).
          'border-hairline bg-surface h-full shrink-0 flex-col border-r',
          layoutClass,
          className
        )}
      >
        {children}
      </nav>
    </SidebarContextProvider>
  );
}
