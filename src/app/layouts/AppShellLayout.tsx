import { Suspense, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router';
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
  Menu,
  Star,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Sidebar, SidebarItem } from '@shared/ui/Sidebar';
import { useDashboardStats } from '@features/dashboard/api/useDashboardStats';
import { useMyAvatars } from '@entities/avatar';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';
import { cn } from '@shared/lib/cn';

// 라우트별 chrome breadcrumb. 단일 출처는 AppShellLayout 의 chrome.
// 페이지가 데이터 로드 후 동적 세그먼트(아바타 이름 등)를 push 할 수 있도록 store slot 을 우선 사용.
// store 가 비어 있으면 pathname 기본 매핑으로 fallback.
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
    <nav aria-label="현재 위치" className="text-body-sm text-text-2">
      <ol className="flex items-center gap-1.5">
        {segments.map((seg, i) => (
          <li key={seg} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="text-text-3">
                &gt;
              </span>
            )}
            <span
              className={i === segments.length - 1 ? 'text-text' : undefined}
              {...(i === segments.length - 1 ? { 'aria-current': 'page' as const } : {})}
            >
              {seg}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

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

// 사이드바 하단 사용자 푸터 — 대표(primary) 아바타를 ★ 마커와 함께 표시 (chat8).
function SidebarUserFooter({ expanded }: { expanded: boolean }) {
  const { data } = useMyAvatars();
  const primary = data?.items.find((a) => a.isPrimary) ?? data?.items[0];

  if (!primary) {
    return <div className="border-border mt-auto border-t" aria-hidden="true" />;
  }

  return (
    <div
      className={cn(
        'border-border mt-auto flex items-center gap-2.5 border-t px-2.5 py-2.5',
        expanded ? '' : 'justify-center lg:justify-start'
      )}
    >
      <span className="bg-bg-elev-3 border-border-hi relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border">
        <span className="text-text font-mono text-[11px] font-medium uppercase">
          {primary.initials}
        </span>
        <span
          aria-label="대표 아바타"
          className="bg-brand absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full"
        >
          <Star size={9} className="fill-white text-white" aria-hidden="true" />
        </span>
      </span>
      <div className={cn('min-w-0', expanded ? '' : 'hidden lg:block')}>
        <div className="font-ui text-body-sm text-text truncate">{primary.name}</div>
        <div className="text-mono-meta text-text-3 truncate font-mono">대표 아바타</div>
      </div>
    </div>
  );
}

// 사이드바 본문(브랜드 + 섹션 + 항목 + 푸터). 레일(반응형)과 모바일 드로어(expanded)에서 공유.
function SidebarBody({
  expanded,
  pathname,
  onNavigate,
}: {
  expanded: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const labelCls = expanded ? '' : 'hidden lg:block';
  return (
    <>
      <div
        className={cn(
          'border-border mb-3 flex items-center gap-2.5 border-b px-2 pt-2 pb-4',
          expanded ? '' : 'justify-center lg:justify-start'
        )}
      >
        <span aria-hidden="true" className="bg-brand h-[22px] w-[22px] shrink-0 rounded-md" />
        <span
          className={cn(
            'font-ui text-text text-[15px] font-semibold tracking-[-0.3px]',
            expanded ? '' : 'hidden lg:inline'
          )}
        >
          Avating
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        <p
          className={cn(
            'text-text-3 px-2 pt-3 pb-1.5 font-mono text-[10px] tracking-[0.5px] uppercase',
            labelCls
          )}
        >
          홈
        </p>
        <SidebarItem
          icon={LayoutGrid}
          label="대시보드"
          to="/dashboard"
          active={pathname === '/dashboard'}
          onClick={onNavigate}
        />
        <SidebarItem icon={Compass} label="아바타 탐색" disabled />
        <SidebarItem icon={Eye} label="관전중" disabled />
        <SidebarItem icon={Heart} label="매칭" disabled />
        <SidebarItem icon={MessageCircle} label="실제 대화" disabled />

        <p
          className={cn(
            'text-text-3 px-2 pt-3 pb-1.5 font-mono text-[10px] tracking-[0.5px] uppercase',
            labelCls
          )}
        >
          내 프로필
        </p>
        <SidebarItem icon={User} label="내 아바타" disabled />
        <SidebarItem icon={Gem} label="다이아" disabled />
        <SidebarItem icon={Settings} label="설정" disabled />
      </div>

      <SidebarUserFooter expanded={expanded} />
    </>
  );
}

export function AppShellLayout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 라우트 변경 시 모바일 드로어 닫기.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Escape 로 드로어 닫기.
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

  // useOutlet() 로 현재 라우트 엘리먼트를 "스냅샷"으로 캡처한다.
  // <Outlet /> 컴포넌트를 직접 두면 AnimatePresence 가 보존한 exit 중인 래퍼가
  // 라우트 컨텍스트를 다시 읽어 새 페이지를 그려버려 이중 마운트(깜빡임)가 발생한다.
  const outlet = useOutlet();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 데스크톱/태블릿 고정 레일 — 모바일(<md)에서는 숨고 햄버거 드로어로 대체 */}
      <Sidebar responsive>
        <SidebarBody expanded={false} pathname={location.pathname} />
      </Sidebar>

      {/* 모바일 드로어 */}
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
              className="absolute inset-y-0 left-0 w-[220px]"
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
        <header className="border-border bg-bg-elev-1 flex h-[52px] shrink-0 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="메뉴 열기"
              aria-expanded={drawerOpen}
              aria-controls="mobile-sidebar"
              className="text-text-2 hover:text-text md:hidden"
              onClick={() => {
                setDrawerOpen(true);
              }}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <ChromeBreadcrumb pathname={location.pathname} />
          </div>
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
                {outlet}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
