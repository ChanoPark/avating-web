import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@shared/ui/Toast/Toast';
import { useAuthStore } from '@entities/auth/store';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';
import { server } from '@shared/mocks/server';
import { statsHandlers } from '@shared/mocks/handlers/dashboard';
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
  return render(
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

  // v2 내비 6항목에는 "대시보드"가 없다. 대시보드·아바타 상세는 모두 "탐색"이 덮는다
  // (LAYOUT-NUMBERS § 사이드바 내비 6항목, wf-s2-core 의 AppShell active="탐색").
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

  // v2 상단 바 우측은 "화면별 액션 + 알림 벨"뿐이고, 크레딧은 사이드바 계정 행으로 내려갔다
  // (LAYOUT-NUMBERS § AppShell).
  describe('크레딧 (사이드바 계정 행)', () => {
    it('사이드바 계정 행에 다이아 잔액 표시 영역이 있다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(within(nav).getByText('잔여 다이아')).toBeInTheDocument();
    });

    it('상단 바에는 다이아 잔액이 없다', () => {
      renderWithProviders('/dashboard');
      const header = screen.getByRole('banner');
      expect(within(header).queryByText(/다이아/)).toBeNull();
    });

    it('stats API 응답 후 다이아 잔액이 숫자로 표시된다', async () => {
      server.use(statsHandlers.success);
      renderWithProviders('/dashboard');

      await waitFor(() => {
        const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
        expect(within(nav).queryByText(/1[,.]?240/)).not.toBeNull();
      });
    });

    it('잔액 숫자에 tabular-nums(tnum) 가 적용된다', async () => {
      server.use(statsHandlers.success);
      renderWithProviders('/dashboard');

      await waitFor(() => {
        const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
        const balance = within(nav).getByText(/1[,.]?240/);
        expect(balance.className).toContain('tnum');
      });
    });
  });

  describe('반응형 (웹 비율 · main-dashboard.md §10)', () => {
    // 데스크톱 폭은 디자인 v2 에서 232px 로 바뀌었다 (LAYOUT-NUMBERS § AppShell). w-58 = 14.5rem.
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

  // LAYOUT-NUMBERS § 사이드바 내비 6항목 — 순서·라벨이 정본이다.
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

  // LAYOUT-NUMBERS § AppShell — 상단 바 height 56(h-14) · padding 0 28px(px-7) · 하단 hairline.
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

    // v2 는 문자로 도형을 그리지 않는다 — `⌘` 는 Pretendard 에 없어 시스템 폰트로 폴백한다.
    it('⌘ 등 문자 글리프를 쓰지 않는다', () => {
      renderWithProviders('/dashboard');
      expect(document.body.textContent ?? '').not.toMatch(/[⌘◇▲↵]/);
      expect(document.querySelector('[aria-label*="⌘"]')).toBeNull();
    });
  });

  // LAYOUT-NUMBERS § AppShell — 본문 padding 28(p-7) · 세로 gap 16(gap-4) · 캔버스 배경.
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
    // LAYOUT-NUMBERS § AppShell: "넓은 뷰포트: 사이드바는 232px 고정, 본문이 늘어납니다."
    // 정본은 본문 폭 상한을 규정하지 않는다 — 우측 사이드 카드(260~272)가 고정폭이고
    // 가운데 열만 신축하는 방식이라 상한이 필요 없다.
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

    // 시각 계약: 13.5px · `--ink-mute` · gap 7 · 구분자 ChevronRight 13px ·
    // 마지막 항목만 `--ink` + weight 500 (LAYOUT-NUMBERS § AppShell).
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

  // LAYOUT-NUMBERS § AppShell — 계정 행: 상단 hairline, padding 10, 내부 4px 6px,
  // 아바타 26 circle, 닉네임 13px, 크레딧 12px.
  describe('계정 행 (LAYOUT-NUMBERS § AppShell)', () => {
    it('상단 hairline + padding 10(p-2.5) · 내부 padding 4px 6px(py-1 px-1.5)', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      const row = within(nav).getByText('잔여 다이아').closest('.border-t');
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
