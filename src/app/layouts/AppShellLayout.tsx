import { Suspense, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router';
import {
  Bell,
  ChevronRight,
  Clock,
  Compass,
  Diamond,
  Heart,
  Menu,
  MessageCircle,
  Sparkles,
  Users,
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
// 시각 계약: fontSize 13.5, `--ink-mute`, gap 7, 구분자 ChevronRight 13px,
// 마지막 항목만 `--ink` + weight 500 (LAYOUT-NUMBERS § AppShell).
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

// 크레딧 표기 — Diamond 아이콘(fontSize × 0.86 = 10.32) + tnum 숫자, gap 4
// (LAYOUT-NUMBERS § 아이콘). `◇` 글리프는 Pretendard 에 없어 쓰지 않는다.
function AccountCredit() {
  const stats = useDashboardStats();
  return (
    <div className="text-ink-mute flex items-center gap-1 text-[12px]">
      <Diamond size={10.32} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      <span className="sr-only">잔여 다이아</span>
      <span className="tnum">{stats.gemsBalance.toLocaleString()}</span>
    </div>
  );
}

function AccountCreditFallback() {
  return (
    <div className="text-ink-mute flex items-center gap-1 text-[12px]">
      <Diamond size={10.32} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      <span className="sr-only">잔여 다이아</span>
      <span className="tnum">—</span>
    </div>
  );
}

// 사이드바 하단 계정 행 — 상단 hairline, padding 10, 내부 padding 4px 6px,
// 아바타 26 circle, 닉네임 13px, 크레딧 12px (LAYOUT-NUMBERS § AppShell).
// 코치 프로필 API 가 아직 없어 대표 아바타를 계정 식별자로 쓴다.
function SidebarAccountRow({ expanded }: { expanded: boolean }) {
  const { data } = useMyAvatars();
  const primary = data?.items.find((a) => a.isPrimary) ?? data?.items[0];

  return (
    <div className="border-hairline mt-auto border-t p-2.5">
      <div
        className={cn(
          'flex items-center gap-2 px-1.5 py-1',
          expanded ? '' : 'justify-center lg:justify-start'
        )}
      >
        {primary && (
          // 아바타 tone=wash — `--primary-wash` 배경 + `--primary` 텍스트, 테두리 없음.
          // fontSize = max(10, 26 × 0.34) = 10.
          <span className="bg-primary-wash text-primary flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
            {primary.initials}
          </span>
        )}
        <div className={cn('min-w-0 flex-1', expanded ? '' : 'hidden lg:block')}>
          {primary && <div className="text-ink truncate text-[13px]">{primary.name}</div>}
          <Suspense fallback={<AccountCreditFallback />}>
            <AccountCredit />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// 사이드바 본문(로고 + 내비 6항목 + 계정 행). 레일(반응형)과 모바일 드로어(expanded)에서 공유.
function SidebarBody({
  expanded,
  pathname,
  onNavigate,
}: {
  expanded: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  // 탐색이 대시보드·아바타 상세를 함께 덮는다 (wf-s2-core 의 AppShell active="탐색").
  const exploreActive = pathname === '/dashboard' || pathname.startsWith('/avatars/');

  return (
    <>
      {/* 로고 영역 — padding 20px 18px 14px, Logo size 19 (LAYOUT-NUMBERS § AppShell). */}
      <div
        className={cn(
          'flex items-center gap-2 px-4.5 pt-5 pb-3.5',
          expanded ? '' : 'justify-center lg:justify-start'
        )}
      >
        {/* 로고 마크 — 정사각 19, radius = 19 × 0.28, `--primary` 채움. */}
        <span
          aria-hidden="true"
          className="bg-primary h-[19px] w-[19px] shrink-0 rounded-[5.32px]"
        />
        {/* 워드마크 — fontSize = 19 × 0.78, weight 500, letterSpacing -0.4px. */}
        <span
          className={cn(
            'text-ink text-[14.82px] font-medium tracking-[-0.4px]',
            expanded ? '' : 'hidden lg:inline'
          )}
        >
          Avating
        </span>
      </div>

      {/* 내비 — 컨테이너 padding 0 10px, 항목 간 gap 2 (LAYOUT-NUMBERS § AppShell).
          아직 화면이 없는 항목은 링크를 만들지 않고 비활성으로 둔다. */}
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
    // 세로 900 초과 시 본문만 스크롤 — 사이드바·상단바는 고정 (LAYOUT-NUMBERS § AppShell).
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
        {/* 상단 바 — height 56, padding 0 28px, 하단 1px hairline, `--surface` 배경. */}
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
          {/* 우측 — 화면별 액션 + 알림 벨 17px, gap 8. 화면별 액션 슬롯은 후속 Phase. */}
          <div className="flex items-center gap-2">
            <button type="button" aria-label="알림" className="text-ink-mute hover:text-ink">
              <Bell size={17} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* 본문 — padding 28, 세로 gap 16. 배경은 캔버스 회색(#f6f7f8). */}
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
              {/* 본문 max-width 를 두지 않는다. LAYOUT-NUMBERS § AppShell 은
                  "넓은 뷰포트: 사이드바는 232px 고정, 본문이 늘어납니다" 로 규정하고
                  본문 폭 상한은 정하지 않는다. 우측 사이드 카드(260~272)가 고정폭이고
                  가운데 열만 신축하는 방식이라 상한이 필요 없다. */}
              <div data-shell-content className="flex w-full flex-col gap-4">
                {outlet}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
