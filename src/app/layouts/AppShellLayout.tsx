import { Outlet, useLocation } from 'react-router';
import {
  LayoutGrid,
  Compass,
  Eye,
  Heart,
  MessageCircle,
  User,
  Gem,
  Settings,
  Search,
  Bell,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Sidebar, SidebarItem } from '@shared/ui/Sidebar';
import { useDashboardStats } from '@features/dashboard/api/useDashboardStats';
import { Suspense } from 'react';

function GemBalance() {
  const stats = useDashboardStats();
  return (
    <div className="flex items-center gap-1">
      <Gem size={14} className="text-brand" aria-hidden="true" />
      <span className="text-mono-meta text-text font-mono">
        {stats.gemsBalance.toLocaleString()}
      </span>
    </div>
  );
}

export function AppShellLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed>
        <div
          className="border-border flex h-14 items-center justify-center border-b"
          title="Avating"
        >
          <span
            aria-hidden="true"
            className="font-ui text-heading text-brand font-semibold tracking-tight"
          >
            A
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
          <SidebarItem
            icon={LayoutGrid}
            label="대시보드"
            to="/dashboard"
            active={location.pathname === '/dashboard'}
          />
          <SidebarItem icon={Compass} label="아바타 탐색" disabled />
          <SidebarItem icon={Eye} label="관전중" disabled />
          <SidebarItem icon={Heart} label="매칭" disabled />
          <SidebarItem icon={MessageCircle} label="실제 대화" disabled />

          <div className="border-border my-2 border-t" aria-hidden="true" />

          <SidebarItem icon={User} label="내 아바타" disabled />
          <SidebarItem icon={Gem} label="다이아" disabled />
          <SidebarItem icon={Settings} label="설정" disabled />
        </div>
      </Sidebar>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-border bg-bg-elev-1 flex h-14 shrink-0 items-center justify-between border-b px-6">
          <div className="text-body-sm text-text-2">홈 &gt; 대시보드</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="검색 (⌘K)"
              className="border-border bg-bg-elev-2 text-text-3 hover:text-text flex h-7 items-center gap-2 rounded-sm border px-3"
            >
              <Search size={12} aria-hidden="true" />
              <span className="text-mono-meta font-mono">⌘K</span>
            </button>
            <button type="button" aria-label="알림" className="text-text-3 hover:text-text">
              <Bell size={16} aria-hidden="true" />
            </button>
            <Suspense
              fallback={
                <div className="flex items-center gap-1">
                  <Gem size={14} className="text-brand" aria-hidden="true" />
                  <span className="text-mono-meta text-text-3 font-mono">—</span>
                </div>
              }
            >
              <GemBalance />
            </Suspense>
          </div>
        </header>

        <main className="bg-bg-elev-1 relative flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="px-6 py-6 md:px-8 md:py-7"
            >
              <div data-shell-content className="mx-auto w-full max-w-[1280px]">
                <Outlet />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
