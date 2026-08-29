import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@shared/ui/Toast/Toast';
import { useAuthStore } from '@entities/auth/store';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';
import { AppShellLayout } from '../AppShellLayout';

const mockToken = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

function renderWithProviders(initialRoute = '/dashboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<AppShellLayout />}>
              <Route
                path="dashboard"
                element={<div data-testid="outlet-content">대시보드 콘텐츠</div>}
              />
              <Route
                path="avatars/:id"
                element={<div data-testid="outlet-content">아바타 상세</div>}
              />
            </Route>
            <Route path="/login" element={<div>LOGIN_PAGE</div>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...view, queryClient };
}

describe('AppShellLayout', () => {
  beforeEach(() => {
    useAuthStore.getState().setToken(mockToken);
  });

  afterEach(() => {
    useAuthStore.getState().clear();
  });

  it('<nav aria-label="메인 내비게이션"> 이 렌더된다', () => {
    renderWithProviders();
    expect(screen.getByRole('navigation', { name: '메인 내비게이션' })).toBeInTheDocument();
  });

  it('/dashboard 경로에서 "탐색" 항목이 aria-current="page" 이다', () => {
    renderWithProviders('/dashboard');
    const exploreItem = screen.getByRole('link', { name: /탐색/ });
    expect(exploreItem).toHaveAttribute('aria-current', 'page');
  });

  it('/avatars/:id 경로에서도 "탐색" 항목이 aria-current="page" 이다', () => {
    renderWithProviders('/avatars/avatar-1');
    const exploreItem = screen.getByRole('link', { name: /탐색/ });
    expect(exploreItem).toHaveAttribute('aria-current', 'page');
  });

  it('<Outlet /> 자리에 children 이 렌더된다', () => {
    renderWithProviders('/dashboard');
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
    expect(screen.getByText('대시보드 콘텐츠')).toBeInTheDocument();
  });

  it('미구현 사이드바 항목은 aria-disabled="true" 이다', () => {
    renderWithProviders('/dashboard');
    const disabledItems = document.querySelectorAll('[aria-disabled="true"]');
    expect(disabledItems.length).toBeGreaterThan(0);
  });

  it('disabled 항목 클릭 시 navigate 가 발생하지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<AppShellLayout />}>
                <Route path="dashboard" element={<LocationDisplay />} />
              </Route>
            </Routes>
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const locationBefore = screen.getByTestId('location').textContent;

    const disabledLinks = document.querySelectorAll('[aria-disabled="true"]');
    if (disabledLinks[0]) {
      await user.click(disabledLinks[0] as HTMLElement, { pointerEventsCheck: 0 });
    }

    const locationAfter = screen.getByTestId('location').textContent;
    expect(locationBefore).toBe(locationAfter);
  });

  describe('크레딧', () => {
    it('사이드바 계정 행에 다이아 잔액이 없다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(within(nav).queryByText(/다이아/)).toBeNull();
    });

    it('상단 바에도 다이아 잔액이 없다', () => {
      renderWithProviders('/dashboard');
      const header = screen.getByRole('banner');
      expect(within(header).queryByText(/다이아/)).toBeNull();
    });
  });

  describe('계정 메뉴 (톱니 드롭다운)', () => {
    function gear() {
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      return within(nav).getByRole('button', { name: '계정 설정' });
    }

    it('기본 상태에서는 메뉴가 닫혀 있다', () => {
      renderWithProviders('/dashboard');
      expect(gear()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('button', { name: '로그아웃' })).toBeNull();
      expect(screen.queryByRole('button', { name: '내 정보' })).toBeNull();
    });

    it('톱니를 누르면 내 정보 · 로그아웃 항목이 나타난다', async () => {
      const user = userEvent.setup();
      renderWithProviders('/dashboard');

      await user.click(gear());

      expect(gear()).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: '내 정보' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    });

    it('열리면 첫 항목으로 포커스가 이동한다', async () => {
      const user = userEvent.setup();
      renderWithProviders('/dashboard');

      await user.click(gear());

      expect(screen.getByRole('button', { name: '내 정보' })).toHaveFocus();
    });

    it('톱니를 다시 누르면 닫힌다', async () => {
      const user = userEvent.setup();
      renderWithProviders('/dashboard');

      await user.click(gear());
      await user.click(gear());

      expect(gear()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('button', { name: '로그아웃' })).toBeNull();
    });

    it('Escape 로 닫히고 톱니로 포커스가 돌아온다', async () => {
      const user = userEvent.setup();
      renderWithProviders('/dashboard');

      await user.click(gear());
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('button', { name: '로그아웃' })).toBeNull();
      expect(gear()).toHaveFocus();
    });

    it('Tab 이 메뉴 안에서 순환한다 — 마지막 항목에서 톱니로 돌아온다', async () => {
      const user = userEvent.setup();
      renderWithProviders('/dashboard');

      await user.click(gear());
      await user.tab();
      expect(screen.getByRole('button', { name: '로그아웃' })).toHaveFocus();

      await user.tab();
      expect(gear()).toHaveFocus();
    });

    it('Shift+Tab 이 첫 항목(톱니)에서 마지막 항목으로 감긴다', async () => {
      const user = userEvent.setup();
      renderWithProviders('/dashboard');

      await user.click(gear());
      await user.tab({ shift: true });
      expect(gear()).toHaveFocus();

      await user.tab({ shift: true });
      expect(screen.getByRole('button', { name: '로그아웃' })).toHaveFocus();
    });

    it('메뉴 바깥을 클릭하면 닫힌다', async () => {
      const user = userEvent.setup();
      renderWithProviders('/dashboard');

      await user.click(gear());
      await user.click(screen.getByTestId('outlet-content'));

      expect(screen.queryByRole('button', { name: '로그아웃' })).toBeNull();
    });

    it('로그아웃을 누르면 세션과 쿼리 캐시가 비워지고 /login 으로 이동한다', async () => {
      const user = userEvent.setup();
      const { queryClient } = renderWithProviders('/dashboard');
      // 훅이 clear 직후 쿼리를 다시 등록하므로, 캐시가 비었는지 보는 대신 clear 호출 자체를 확인한다.
      const clearSpy = vi.spyOn(queryClient, 'clear');

      await user.click(gear());
      await user.click(screen.getByRole('button', { name: '로그아웃' }));

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().status).toBe('anonymous');
      expect(clearSpy).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument();
      });
      clearSpy.mockRestore();
    });

    it('로그아웃 시 온보딩 진행 기록도 지운다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'creating');
      localStorage.setItem('avating:onboarding:method', 'connect');
      const user = userEvent.setup();
      renderWithProviders('/dashboard');

      await user.click(gear());
      await user.click(screen.getByRole('button', { name: '로그아웃' }));

      expect(localStorage.getItem('avating:onboarding:progress')).toBeNull();
      expect(localStorage.getItem('avating:onboarding:method')).toBeNull();
    });

    // 추측 연결이나 '준비중' 문구로 고치지 않는다 — 사양이 오면 onClick 만 채운다.
    it('내 정보는 정본에 목적지가 없어 아무 데도 이동하지 않는다', async () => {
      const user = userEvent.setup();
      renderWithProviders('/dashboard');

      await user.click(gear());
      await user.click(screen.getByRole('button', { name: '내 정보' }));

      expect(screen.getByTestId('outlet-content')).toHaveTextContent('대시보드 콘텐츠');
      expect(screen.queryByText('LOGIN_PAGE')).toBeNull();
      expect(useAuthStore.getState().accessToken).not.toBeNull();
    });
  });

  describe('반응형 (웹 비율 · main-dashboard.md §10)', () => {
    it('고정 레일은 모바일에서 숨고(md 부터 표시) 태블릿 64px·데스크톱 232px 로 리플로우한다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(nav.className).toContain('hidden');
      expect(nav.className).toContain('md:flex');
      expect(nav.className).toContain('md:w-16');
      expect(nav.className).toContain('lg:w-58');
    });

    it('모바일 햄버거 버튼(메뉴 열기)이 헤더에 존재한다', () => {
      renderWithProviders('/dashboard');
      const hamburger = screen.getByRole('button', { name: '메뉴 열기' });
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
      expect(hamburger.className).toContain('md:hidden');
    });

    it('햄버거 클릭 시 드로어가 열린다 (메인 내비게이션 2개)', async () => {
      const user = userEvent.setup();
      renderWithProviders('/dashboard');
      await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
      await waitFor(() => {
        expect(screen.getAllByRole('navigation', { name: '메인 내비게이션' }).length).toBe(2);
      });
    });
  });

  describe('라벨 사이드바 (232px · LAYOUT-NUMBERS § AppShell)', () => {
    it('사이드바는 라벨 모드(data-collapsed="false") 로 렌더된다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(nav).toHaveAttribute('data-collapsed', 'false');
    });

    it('데스크톱 사이드바 폭은 w-58(232px) 이다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(nav.className.includes('w-58')).toBe(true);
    });

    it('사이드바 항목 라벨이 데스크톱(lg)에서 표시된다 (lg:not-sr-only)', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      const exploreLink = within(nav).getByRole('link', { name: /탐색/ });
      const labelSpan = within(exploreLink).getByText('탐색');
      expect(labelSpan.className).toContain('lg:not-sr-only');
    });

    it('사이드바 상단에 브랜드명 "Avating" 이 표시된다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(within(nav).getByText('Avating')).toBeInTheDocument();
    });
  });

  describe('내비 6항목 (LAYOUT-NUMBERS § 사이드바 내비 6항목)', () => {
    const EXPECTED = ['탐색', '매칭 요청', '시뮬레이션', '실제 대화', '내 아바타', '대화 기록'];

    it('정본 순서대로 6개 항목이 렌더된다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      const items = within(nav).getAllByRole('link');
      expect(items.map((el) => el.textContent?.trim())).toEqual(EXPECTED);
    });

    it('화면이 없는 5개 항목은 링크가 아니라 비활성이다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      const disabled = nav.querySelectorAll('[aria-disabled="true"]');
      expect(disabled.length).toBe(5);
      expect(nav.querySelectorAll('a[href]').length).toBe(1);
    });

    it('내비 컨테이너는 padding 0 10px(px-2.5) · 항목 gap 2(gap-0.5) 이다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      const list = within(nav).getByRole('link', { name: /탐색/ }).parentElement;
      expect(list?.className).toContain('px-2.5');
      expect(list?.className).toContain('gap-0.5');
    });
  });

  describe('상단 바 (LAYOUT-NUMBERS § AppShell)', () => {
    it('height 56 · padding 0 28px · 하단 hairline · surface 배경', () => {
      renderWithProviders('/dashboard');
      const header = screen.getByRole('banner');
      expect(header.className).toContain('h-14');
      expect(header.className).toContain('px-7');
      expect(header.className).toContain('border-b');
      expect(header.className).toContain('border-hairline');
      expect(header.className).toContain('bg-surface');
    });

    it('알림 벨 버튼이 있다', () => {
      renderWithProviders('/dashboard');
      const header = screen.getByRole('banner');
      expect(within(header).getByRole('button', { name: '알림' })).toBeInTheDocument();
    });

    // ⌘ 는 Pretendard 에 없어 시스템 폰트로 폴백해 깨져 보인다.
    it('⌘ 등 문자 글리프를 쓰지 않는다', () => {
      renderWithProviders('/dashboard');
      expect(document.body.textContent ?? '').not.toMatch(/[⌘◇▲↵]/);
      expect(document.querySelector('[aria-label*="⌘"]')).toBeNull();
    });
  });

  describe('본문 (LAYOUT-NUMBERS § AppShell)', () => {
    it('본문 padding 은 28(p-7) 이다', () => {
      renderWithProviders('/dashboard');
      const container = screen.getByTestId('outlet-content').closest('[data-shell-content]');
      expect(container?.parentElement?.className).toContain('p-7');
    });

    it('본문 콘텐츠는 세로 gap 16(gap-4) 으로 쌓인다', () => {
      renderWithProviders('/dashboard');
      const container = screen.getByTestId('outlet-content').closest('[data-shell-content]');
      expect(container?.className).toContain('flex-col');
      expect(container?.className).toContain('gap-4');
    });

    it('본문 배경은 캔버스 회색(bg-canvas), 사이드바·상단바는 고정이다', () => {
      renderWithProviders('/dashboard');
      const main = document.querySelector('main');
      expect(main?.className).toContain('bg-canvas');
      expect(main?.className).toContain('overflow-y-auto');
    });
  });

  describe('메인 콘텐츠 폭', () => {
    it('콘텐츠 컨테이너에 폭 상한을 두지 않는다', () => {
      renderWithProviders('/dashboard');
      const outlet = screen.getByTestId('outlet-content');
      const container = outlet.closest('[data-shell-content]');
      expect(container?.className).toContain('w-full');
      expect(container?.className).not.toMatch(/\bmax-w-/);
    });

    it('콘텐츠 컨테이너를 가운데로 몰지 않는다 (좌측 정렬로 신축)', () => {
      renderWithProviders('/dashboard');
      const outlet = screen.getByTestId('outlet-content');
      const container = outlet.closest('[data-shell-content]');
      expect(container?.className).not.toContain('mx-auto');
    });
  });

  describe('chrome breadcrumb (라우트별 매핑 + store slot)', () => {
    it('/dashboard 에서는 "홈 > 대시보드" 가 표시된다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '현재 위치' });
      expect(nav).toHaveTextContent('홈');
      expect(nav).toHaveTextContent('대시보드');
      expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent('대시보드');
    });

    it('/avatars/:id 기본 매핑은 "홈 > 탐색" (store 비어있을 때)', () => {
      renderWithProviders('/avatars/avatar-1');
      const nav = screen.getByRole('navigation', { name: '현재 위치' });
      expect(nav).toHaveTextContent('홈');
      expect(nav).toHaveTextContent('탐색');
      expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent('탐색');
    });

    it('store 에 trail 이 push 되면 동적 세그먼트(아바타 이름 등) 가 마지막에 추가된다', () => {
      useChromeBreadcrumbStore.getState().setTrail(['홈', '탐색', 'Moonlit Narrator']);
      renderWithProviders('/avatars/avatar-1');
      const nav = screen.getByRole('navigation', { name: '현재 위치' });
      expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent('Moonlit Narrator');
      useChromeBreadcrumbStore.getState().clearTrail();
    });

    it('13.5px · ink-mute · gap 7 로 렌더된다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '현재 위치' });
      expect(nav.className).toContain('text-[13.5px]');
      expect(nav.className).toContain('text-ink-mute');
      expect(nav.querySelector('ol')?.className).toContain('gap-[7px]');
    });

    it('구분자는 문자가 아니라 ChevronRight 13px 아이콘이다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '현재 위치' });
      expect(nav.textContent).not.toContain('>');
      const separator = nav.querySelector('svg');
      expect(separator).not.toBeNull();
      expect(separator).toHaveAttribute('width', '13');
      expect(separator).toHaveAttribute('stroke-width', '1.5');
    });

    it('마지막 항목만 ink + weight 500 이다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '현재 위치' });
      const current = nav.querySelector('[aria-current="page"]');
      expect(current?.className).toContain('text-ink');
      expect(current?.className).toContain('font-medium');
      const first = nav.querySelectorAll('li > span')[0];
      expect(first?.className ?? '').not.toContain('font-medium');
    });
  });

  describe('계정 행 (LAYOUT-NUMBERS § AppShell)', () => {
    it('상단 hairline + padding 10(p-2.5) · 내부 padding 4px 6px(py-1 px-1.5)', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      const row = within(nav).getByRole('button', { name: '계정 설정' }).closest('.border-t');
      expect(row?.className).toContain('border-hairline');
      expect(row?.className).toContain('p-2.5');
      expect(row?.firstElementChild?.className).toContain('px-1.5');
      expect(row?.firstElementChild?.className).toContain('py-1');
    });

    it('아바타는 26px 원형(h-6.5 w-6.5 rounded-full) 이다', async () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      await waitFor(() => {
        const avatar = nav.querySelector('.rounded-full');
        expect(avatar).not.toBeNull();
        expect(avatar?.className).toContain('h-6.5');
        expect(avatar?.className).toContain('w-6.5');
      });
    });
  });
});
