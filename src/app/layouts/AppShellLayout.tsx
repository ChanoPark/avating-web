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
import { DUR_BASE, DUR_SLOW, EASE_OUT, EASE_STANDARD } from '@shared/lib/motion';

// 정본 `.cx-iconbtn` — radius-chip, 크기 md 36 / lg 44(터치), quiet hover 는 raised 판.
// 모바일 44 / 데스크톱 36. 예전에는 상자 없이 글리프만 있어 벨이 17×17 이었다.
const ICON_BUTTON_CLASS =
  'text-secondary hover:bg-raised hover:text-primary rounded-chip ease-standard flex size-11 shrink-0 items-center justify-center transition-colors duration-[var(--dur-fast)] md:size-9';

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
    <nav aria-label="현재 위치" className="text-secondary text-caption">
      <ol className="flex items-center gap-1.5">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <li key={seg} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  size={13}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="text-secondary shrink-0"
                />
              )}
              <span
                className={isLast ? 'text-primary font-medium' : undefined}
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
        <span aria-hidden="true" className="bg-action rounded-chip size-4.5 shrink-0" />
        <span
          className={cn(
            // 정본 `.hf-word{font-size:var(--fs-20);font-weight:var(--fw-bold);letter-spacing:-0.03em}`
            'text-ink text-title font-bold tracking-[-0.03em]',
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
              className="bg-overlay absolute inset-0"
              onClick={() => {
                setDrawerOpen(false);
              }}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR_BASE, ease: EASE_STANDARD }}
            />
            <motion.div
              id="mobile-sidebar"
              className="absolute inset-y-0 left-0 w-60"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: DUR_SLOW, ease: EASE_OUT }}
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
        <header className="border-subtle bg-canvas flex h-14 shrink-0 items-center justify-between border-b px-7">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="메뉴 열기"
              aria-expanded={drawerOpen}
              aria-controls="mobile-sidebar"
              className={cn(ICON_BUTTON_CLASS, 'md:hidden')}
              onClick={() => {
                setDrawerOpen(true);
              }}
            >
              <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <ChromeBreadcrumb pathname={location.pathname} />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="알림" className={ICON_BUTTON_CLASS}>
              <Bell size={17} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="bg-canvas relative flex-1 overflow-y-auto">
          {/* AnimatePresence mode="wait" 를 쓰면 exit(150ms)가 끝나야 새 페이지가 마운트돼
              클릭 → 정착이 700ms 로 늘고 그중 ~300ms 동안 본문이 비어 보였다(실측).
              WizardShell 과 같이 **입장 전용** 으로 맞춘다 — 새 스텝이 즉시 마운트되고,
              mode 없이 AnimatePresence 만 두면 두 페이지가 세로로 겹쳐 쌓인다. */}
          <motion.div
            key={location.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR_BASE, ease: EASE_STANDARD }}
            className="p-7"
          >
            {/* 본문에 max-width 를 두지 않는다 — 우측 카드가 고정폭이라 가운데 열만 신축하면 된다. */}
            <div data-shell-content className="flex w-full flex-col gap-4">
              {/* 본문에서 터진 예외만 여기서 잡는다 — 셸 크롬이 통째로 터지면 SuspenseRoute 의
                  바깥 경계가 받는다. */}
              <RouteErrorBoundary embedded>{content}</RouteErrorBoundary>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
