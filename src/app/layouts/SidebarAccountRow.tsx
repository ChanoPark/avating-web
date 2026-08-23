import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '@entities/auth/store';
import { useMyAvatars } from '@entities/avatar';
import { clearOnboardingProgress } from '@entities/onboarding';
import { cn } from '@shared/lib/cn';

// 사이드바 하단 계정 행 + 계정 메뉴.
// 정본: .claude/design/2026-08-21-wireframe-v2.6/wf/wf-kit-excerpt.jsx `AccountMenu`
//      · wf/accountmenu.css (`.wf-gear` · `.wf-accountmenu`).
// v2.5 까지 이 자리에 있던 크레딧(잔여 다이아)이 톱니 버튼으로 교체됐다 — 잔액은
// 대시보드 Stat 카드(S-03-01)에 그대로 남아 있어 화면에서 사라지지는 않는다.
//
// 정본은 와이어프레임이라 `open` 토글만 그린다. 바깥 클릭·Escape·포커스 이동·라우트 변경 시
// 닫기는 값이 없어 웹 기본기(design-fidelity §4)로 채웠다.

// 메뉴 항목 — padding 7px 9px, radius 6(--r-sm), fontSize 13, 아이콘 14px, gap 8.
const MENU_ITEM =
  'flex w-full items-center gap-2 rounded-sm px-[9px] py-[7px] text-[13px] hover:bg-canvas-soft focus-visible:shadow-focus outline-none';

export function SidebarAccountRow({ expanded }: { expanded: boolean }) {
  const { data } = useMyAvatars();
  const primary = data?.items.find((a) => a.isPrimary) ?? data?.items[0];

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 열리면 첫 항목으로 포커스를 옮긴다 — 마우스로 연 사람에겐 보이지 않고,
  // 키보드로 연 사람은 곧장 항목을 고를 수 있다.
  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  // Escape 로 닫고 톱니로 포커스를 되돌린다.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      gearRef.current?.focus();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // 바깥 클릭으로 닫기. 톱니 자체는 컨테이너 안이라 토글 핸들러가 처리한다.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node) === true) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  // 라우트가 바뀌면 닫는다 — 열어 둔 채 이동하면 새 화면 위에 메뉴가 떠 있게 된다.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setOpen(false);
    useAuthStore.getState().clear();
    // 개인 데이터가 캐시에 남으면 다음에 로그인한 사람이 그대로 본다.
    queryClient.clear();
    // 진행 기록은 브라우저 단위라 계정을 따라가지 않는다. 남겨 두면 다음 사용자가
    // 이전 사용자가 고른 생성 방법으로 밀려 들어간다.
    clearOnboardingProgress();
    void navigate('/login', { replace: true });
  };

  return (
    // 상단 hairline, padding 10 (LAYOUT-NUMBERS § AppShell).
    <div ref={containerRef} className="border-hairline relative mt-auto border-t p-2.5">
      {/* 계정 행 — 내부 padding 4px 6px. 좁은 레일(md)에서는 톱니만 남긴다:
          아바타·닉네임은 장식이고 톱니가 유일한 조작점이라 64px 안에서 기능을 지킨다. */}
      <div
        className={cn(
          'flex items-center gap-2 px-1.5 py-1',
          expanded ? 'justify-between' : 'justify-center lg:justify-between'
        )}
      >
        <div className={cn('flex min-w-0 items-center gap-2', expanded ? '' : 'hidden lg:flex')}>
          {primary && (
            // 아바타 tone=wash — `--primary-wash` 배경 + `--primary` 텍스트, 테두리 없음.
            // fontSize = max(10, 26 × 0.34) = 10.
            <span className="bg-primary-wash text-primary flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
              {primary.initials}
            </span>
          )}
          {primary && <div className="text-ink truncate text-[13px]">{primary.name}</div>}
        </div>

        {/* 톱니 — 28×28, radius 7, 아이콘 18px. 기본 `--ink-mute`, hover `--canvas-soft`+`--ink`,
            열림 `--primary-wash`+`--primary-press` (wf/accountmenu.css `.wf-gear`). */}
        <button
          ref={gearRef}
          type="button"
          aria-label="계정 설정"
          aria-haspopup="true"
          aria-expanded={open}
          {...(open ? { 'aria-controls': menuId } : {})}
          onClick={() => {
            setOpen((v) => !v);
          }}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] outline-none',
            'focus-visible:shadow-focus ease-brand transition-colors duration-[var(--dur-fast)]',
            open
              ? 'bg-primary-wash text-primary-press'
              : 'text-ink-mute hover:bg-canvas-soft hover:text-ink'
          )}
        >
          <Settings size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {open && (
        // 계정 행 위로 8px 띄워 연다. 폭은 계정 행에 맞추되(좌우 0), 좁은 레일에서는
        // 44px 밖에 안 남아 내용 폭(w-max)으로 흘려보낸다.
        // z 는 정본의 raw 20 대신 의미 토큰(--z-dropdown)을 쓴다.
        <div
          id={menuId}
          className={cn(
            'bg-surface border-hairline shadow-lift absolute bottom-[calc(100%+8px)] rounded-[10px] border p-[5px]',
            'z-[var(--z-dropdown)]',
            expanded ? 'right-0 left-0' : 'left-0 w-max lg:right-0 lg:w-auto'
          )}
        >
          {/* spec-gap — 정본에 항목만 있고 목적지 화면이 없다. `wf/wf-spec.jsx` SPEC_SCREENS 41개에
              계정 정보 화면이 없고, S-09-01 `내 아바타` 는 아바타 스탯 화면이라 다른 것이다.
              2026-08-21 사용자 결정: 항목은 정본대로 그리되 플로우에는 연결하지 않는다.
              목적지를 추측해 잇는 것도, '준비중' 문구나 disabled 를 지어내는 것도 창작이라 하지 않는다.
              사양이 오면 onClick 만 채우면 된다. 회귀 방지는 AppShellLayout.test.tsx 가 맡는다. */}
          <button ref={firstItemRef} type="button" className={cn(MENU_ITEM, 'text-ink')}>
            <User size={14} strokeWidth={1.5} aria-hidden="true" />내 정보
          </button>

          {/* 구분선 — height 1, `--hairline`, margin 5px 3px. */}
          <div aria-hidden="true" className="bg-hairline mx-[3px] my-[5px] h-px" />

          {/* 정본은 이 자리에 `x` 아이콘을 쓴다. 와이어프레임 아이콘 세트(WF_ICONS 26종)에
              로그아웃 글리프가 없어 고른 것으로 보여 lucide `LogOut` 으로 옮겼다. */}
          <button type="button" onClick={handleLogout} className={cn(MENU_ITEM, 'text-danger')}>
            <LogOut size={14} strokeWidth={1.5} aria-hidden="true" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
