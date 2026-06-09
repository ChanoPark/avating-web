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

  it('/dashboard 경로에서 "대시보드" 항목이 aria-current="page" 이다', () => {
    renderWithProviders('/dashboard');
    const dashboardItem = screen.getByRole('link', { name: /대시보드/ });
    expect(dashboardItem).toHaveAttribute('aria-current', 'page');
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

  it('헤더에 다이아 잔액 표시 영역이 있다', () => {
    renderWithProviders('/dashboard');
    const gemArea =
      screen.queryByText(/다이아/) ??
      screen.queryByTestId('gem-balance') ??
      screen.queryByLabelText(/다이아/);
    expect(gemArea).not.toBeNull();
  });

  describe('GemBalance', () => {
    it('stats API 응답 후 다이아 잔액이 숫자로 표시된다', async () => {
      server.use(statsHandlers.success);
      renderWithProviders('/dashboard');

      await waitFor(() => {
        const balanceEl = screen.queryByText(/1[,.]?240/);
        expect(balanceEl).not.toBeNull();
      });
    });
  });

  describe('반응형 (웹 비율 · main-dashboard.md §10)', () => {
    it('고정 레일은 모바일에서 숨고(md 부터 표시) 태블릿 64px·데스크톱 220px 로 리플로우한다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(nav.className).toContain('hidden');
      expect(nav.className).toContain('md:flex');
      expect(nav.className).toContain('md:w-16');
      expect(nav.className).toContain('lg:w-[220px]');
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

  describe('라벨 사이드바 (220px · main-dashboard.md 정본)', () => {
    it('사이드바는 라벨 모드(data-collapsed="false") 로 렌더된다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(nav).toHaveAttribute('data-collapsed', 'false');
    });

    it('데스크톱 사이드바 폭은 w-[220px] 이다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(nav.className.includes('w-[220px]')).toBe(true);
    });

    it('사이드바 항목 라벨이 데스크톱(lg)에서 표시된다 (lg:not-sr-only)', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      const dashboardLink = within(nav).getByRole('link', { name: /대시보드/ });
      const labelSpan = within(dashboardLink).getByText('대시보드');
      expect(labelSpan.className).toContain('lg:not-sr-only');
    });

    it('사이드바 상단에 브랜드명 "Avating" 이 표시된다', () => {
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      expect(within(nav).getByText('Avating')).toBeInTheDocument();
    });
  });

  describe('메인 콘텐츠 폭 (웹 비율)', () => {
    it('메인 영역 안 콘텐츠 컨테이너에 max-w-[1280px] 가 적용된다', () => {
      renderWithProviders('/dashboard');
      const outlet = screen.getByTestId('outlet-content');
      const container = outlet.closest('[data-shell-content]');
      expect(container?.className.includes('max-w-[1280px]')).toBe(true);
    });

    it('메인 영역 안 콘텐츠 컨테이너에 mx-auto 가 적용된다 (가운데 정렬)', () => {
      renderWithProviders('/dashboard');
      const outlet = screen.getByTestId('outlet-content');
      const container = outlet.closest('[data-shell-content]');
      expect(container?.className.includes('mx-auto')).toBe(true);
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
  });
});
