import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useOutlet } from 'react-router';
import {
  Bell,
  ChevronRight,
  Clock,
  Compass,
  Heart,
  Menu,
  MessageCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { RouteErrorBoundary } from '../providers/RouteErrorBoundary';
import { SidebarAccountRow } from './SidebarAccountRow';
import { Sidebar, SidebarItem } from '@shared/ui/Sidebar';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';
import { cn } from '@shared/lib/cn';

function ChromeBreadcrumb({ pathname }: { pathname: string }) {
  const trail = useChromeBreadcrumbStore((s) => s.trail);
  const segments =
    trail !== null && trail.length > 0
      ? trail
      : pathname === '/dashboard'
        ? ['홈', '대시보드']
        : pathname.startsWith('/avatars/')
          ? ['홈', '탐색']
          : ['홈'];
  return (
    <nav aria-label="현재 위치" className="text-ink-mute text-[13.5px]">
      <ol className="flex items-center gap-[7px]">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <li key={seg} className="flex items-center gap-[7px]">
              {i > 0 && (
                <ChevronRight
                  size={13}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="text-ink-mute shrink-0"
                />
              )}
              <span
                className={isLast ? 'text-ink font-medium' : undefined}
                {...(isLast ? { 'aria-current': 'page' as const } : {})}
              >
                {seg}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SidebarBody({
  expanded,
  pathname,
  onNavigate,
}: {
  expanded: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  // 탐색 항목은 대시보드와 아바타 상세 경로에서 함께 활성화된다.
  const exploreActive = pathname === '/dashboard' || pathname.startsWith('/avatars/');

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 px-4.5 pt-5 pb-3.5',
          expanded ? '' : 'justify-center lg:justify-start'
        )}
      >
        <span
          aria-hidden="true"
          className="bg-primary h-[19px] w-[19px] shrink-0 rounded-[5.32px]"
        />
        <span
          className={cn(
            'text-ink text-[14.82px] font-medium tracking-[-0.4px]',
            expanded ? '' : 'hidden lg:inline'
          )}
        >
          Avating
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5">
        <SidebarItem
          icon={Compass}
          label="탐색"
          to="/dashboard"
          active={exploreActive}
          onClick={onNavigate}
        />
        <SidebarItem icon={Heart} label="매칭 요청" disabled />
        <SidebarItem icon={MessageCircle} label="시뮬레이션" disabled />
        <SidebarItem icon={Users} label="실제 대화" disabled />
        <SidebarItem icon={Sparkles} label="내 아바타" disabled />
        <SidebarItem icon={Clock} label="대화 기록" disabled />
      </div>

      <SidebarAccountRow expanded={expanded} />
    </>
  );
}

type AppShellLayoutProps = {
  /** 주어지면 라우트 outlet 대신 이걸 렌더한다 — 라우트에 매달리지 않은 화면(404 등)을 셸 안에 넣을 때 쓴다. */
  children?: ReactNode;
};

export function AppShellLayout({ children }: AppShellLayoutProps = {}) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  // <Outlet /> 대신 useOutlet() 으로 스냅샷을 캡처한다 — 그렇지 않으면 AnimatePresence 가
  // 남겨둔 exit 중인 래퍼가 새 페이지를 다시 그려 이중 마운트가 일어난다.
  const outlet = useOutlet();
  const content = children ?? outlet;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar responsive>
        <SidebarBody expanded={false} pathname={location.pathname} />
      </Sidebar>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[var(--z-modal)] md:hidden">
            <motion.div
              className="absolute inset-0 bg-black/60"
              onClick={() => {
                setDrawerOpen(false);
              }}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            />
            <motion.div
              id="mobile-sidebar"
              className="absolute inset-y-0 left-0 w-58"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Sidebar className="h-full">
                <SidebarBody
                  expanded
                  pathname={location.pathname}
                  onNavigate={() => {
                    setDrawerOpen(false);
                  }}
                />
              </Sidebar>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-hairline bg-surface flex h-14 shrink-0 items-center justify-between border-b px-7">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="메뉴 열기"
              aria-expanded={drawerOpen}
              aria-controls="mobile-sidebar"
              className="text-ink-mute hover:text-ink md:hidden"
              onClick={() => {
                setDrawerOpen(true);
              }}
            >
              <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <ChromeBreadcrumb pathname={location.pathname} />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="알림" className="text-ink-mute hover:text-ink">
              <Bell size={17} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="bg-canvas relative flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="p-7"
            >
              {/* 본문에 max-width 를 두지 않는다 — 우측 카드가 고정폭이라 가운데 열만 신축하면 된다. */}
              <div data-shell-content className="flex w-full flex-col gap-4">
                {/* 본문에서 터진 예외만 여기서 잡는다 — 셸 크롬이 통째로 터지면 SuspenseRoute 의
                    바깥 경계가 받는다. */}
                <RouteErrorBoundary embedded>{content}</RouteErrorBoundary>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
