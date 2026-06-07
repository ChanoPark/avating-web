import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
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

let avatarMounts = 0;

function DashboardProbe() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate('/avatars/1')}>
      go-avatar
    </button>
  );
}

function AvatarProbe() {
  useEffect(() => {
    avatarMounts += 1;
  }, []);
  return <div data-testid="avatar-probe">avatar</div>;
}

function renderTree() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<AppShellLayout />}>
              <Route path="dashboard" element={<DashboardProbe />} />
              <Route path="avatars/:id" element={<AvatarProbe />} />
            </Route>
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AppShellLayout 페이지 전환 — 이중 마운트 회귀', () => {
  beforeEach(() => {
    avatarMounts = 0;
    useAuthStore.getState().setToken(mockToken);
  });

  afterEach(() => {
    useAuthStore.getState().clear();
  });

  it('대시보드 → 아바타 상세 이동 시 목적지 페이지가 한 번만 마운트된다', async () => {
    const user = userEvent.setup();
    renderTree();

    await user.click(screen.getByText('go-avatar'));
    await waitFor(() => expect(screen.getByTestId('avatar-probe')).toBeInTheDocument());

    // exit 애니메이션 완료 후 재마운트 여부까지 포착하기 위해 한 프레임 더 흘려보낸다.
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(avatarMounts).toBe(1);
  });
});
