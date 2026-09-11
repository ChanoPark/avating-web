import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '@entities/auth/store';
import { useMyAvatars } from '@entities/avatar';
import { clearOnboardingProgress } from '@entities/onboarding';
import { cn } from '@shared/lib/cn';
import { useFocusTrap } from '@shared/lib/useFocusTrap';

// 와이어프레임은 open 토글만 그린다 — 나머지 닫기 동작(바깥 클릭·Escape 등)은 정본에 없어 직접 채웠다.

const MENU_ITEM =
  'flex w-full items-center gap-2 rounded-chip px-[9px] py-[7px] text-[13px] hover:bg-surface';

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

  // 열리면 첫 항목으로 포커스를 옮긴다 — 키보드 사용자가 바로 항목을 고를 수 있게 한다.
  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  // 트랩 범위를 메뉴가 아니라 containerRef(계정 행 전체)로 잡는다 — 메뉴만 가두면 톱니가
  // 순환에서 빠져, Tab 으로 톱니까지 돌아와도 다시 닫을 수 없다.
  useFocusTrap(open, containerRef);

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
    // 진행 기록은 브라우저 단위라, 지우지 않으면 다음 로그인 사용자가 이전 사용자의 진행 상태를 물려받는다.
    clearOnboardingProgress();
    void navigate('/login', { replace: true });
  };

  return (
    <div ref={containerRef} className="border-subtle relative mt-auto border-t p-2.5">
      {/* 좁은 레일에서는 톱니만 남긴다 — 아바타·닉네임은 장식이고 톱니가 유일한 조작점이다. */}
      <div
        className={cn(
          'flex items-center gap-2 px-1.5 py-1',
          expanded ? 'justify-between' : 'justify-center lg:justify-between'
        )}
      >
        <div className={cn('flex min-w-0 items-center gap-2', expanded ? '' : 'hidden lg:flex')}>
          {primary && (
            <span className="bg-id-none text-id-none-fg flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
              {primary.initials}
            </span>
          )}
          {primary && <div className="text-primary truncate text-[13px]">{primary.name}</div>}
        </div>

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
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]',
            'ease-standard transition-colors duration-[var(--dur-fast)]',
            open
              ? 'bg-action-tint text-action-press'
              : 'text-secondary hover:bg-surface hover:text-primary'
          )}
        >
          <Settings size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {open && (
        // z 는 정본의 raw 값(20) 대신 --z-dropdown 토큰을 쓴다.
        <div
          id={menuId}
          className={cn(
            'bg-canvas border-subtle absolute bottom-[calc(100%+8px)] rounded-[10px] border p-[5px]',
            'z-[var(--z-dropdown)]',
            expanded ? 'right-0 left-0' : 'left-0 w-max lg:right-0 lg:w-auto'
          )}
        >
          {/* 목적지가 없다 — 추측 연결도 '준비중' 문구도 만들지 않는다. 사양이 오면 onClick 만 채운다. */}
          <button ref={firstItemRef} type="button" className={cn(MENU_ITEM, 'text-primary')}>
            <User size={14} strokeWidth={1.5} aria-hidden="true" />내 정보
          </button>

          <div aria-hidden="true" className="bg-subtle mx-[3px] my-[5px] h-px" />

          {/* 정본은 `x` 아이콘이지만 와이어프레임 아이콘 세트에 로그아웃 글리프가 없어 lucide LogOut 으로
              대신한다. */}
          <button type="button" onClick={handleLogout} className={cn(MENU_ITEM, 'text-danger')}>
            <LogOut size={14} strokeWidth={1.5} aria-hidden="true" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
