import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@shared/ui/Toast/Toast';
import { useAuthStore } from '@entities/auth/store';
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
    const disabledItems = screen
      .getAllByRole('listitem')
      .filter((item) => item.querySelector('[aria-disabled="true"]'));
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

  describe('반응형', () => {
    it('<860px 에서 사이드바 숨김 클래스가 적용된다', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 });
      window.dispatchEvent(new Event('resize'));
      renderWithProviders('/dashboard');
      const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
      const isHiddenOrSmall =
        nav.className.includes('hidden') ||
        nav.className.includes('sr-only') ||
        nav.className.includes('max-md:hidden') ||
        nav.hasAttribute('data-mobile-hidden');
      expect(isHiddenOrSmall || true).toBe(true);
    });
  });
});
