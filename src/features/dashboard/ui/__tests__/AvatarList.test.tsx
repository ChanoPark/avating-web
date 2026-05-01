import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { MemoryRouter } from 'react-router';
import { ToastProvider } from '@shared/ui/Toast/Toast';
import { server } from '@shared/mocks/server';
import { recommendedHandlers } from '@shared/mocks/handlers/dashboard';
import { AvatarList } from '../AvatarList';
import type { RecommendedAvatarFilter } from '@entities/dashboard/model';

const defaultFilter: RecommendedAvatarFilter = {
  online: false,
  introvert: false,
  extrovert: false,
  verified: false,
};

function renderWithProviders(
  ui: React.ReactNode,
  { onAvatarClick = vi.fn(), onResetFilter = vi.fn() } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    onAvatarClick,
    onResetFilter,
    ...render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          MemoryRouter,
          null,
          createElement(
            ToastProvider,
            null,
            createElement(
              ErrorBoundary,
              {
                fallback: createElement('div', { 'data-testid': 'list-error' }, '리스트 오류'),
              },
              createElement(
                Suspense,
                { fallback: createElement('div', { 'data-testid': 'loading' }, '로딩 중') },
                ui
              )
            )
          )
        )
      )
    ),
  };
}

describe('AvatarList', () => {
  it('정상 데이터 시 아바타 행이 렌더된다', async () => {
    server.use(recommendedHandlers.success);
    const onAvatarClick = vi.fn();
    renderWithProviders(
      createElement(AvatarList, {
        filter: defaultFilter,
        onAvatarClick,
        onResetFilter: vi.fn(),
      }),
      { onAvatarClick }
    );

    await waitFor(() => {
      expect(screen.getByText('Moonlit')).toBeInTheDocument();
    });

    expect(screen.getByText('Moonlit')).toBeInTheDocument();
    expect(screen.getByText('Spring')).toBeInTheDocument();
  });

  it('빈 응답 시 "추천 아바타 없음" 텍스트가 렌더된다', async () => {
    server.use(recommendedHandlers.empty);
    renderWithProviders(
      createElement(AvatarList, {
        filter: defaultFilter,
        onAvatarClick: vi.fn(),
        onResetFilter: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/추천 아바타 없음/)).toBeInTheDocument();
    });
  });

  it('빈 응답 시 "필터 초기화" 버튼이 렌더된다', async () => {
    server.use(recommendedHandlers.empty);
    renderWithProviders(
      createElement(AvatarList, {
        filter: defaultFilter,
        onAvatarClick: vi.fn(),
        onResetFilter: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /필터 초기화/ })).toBeInTheDocument();
    });
  });

  it('"필터 초기화" 클릭 시 onResetFilter 가 호출된다', async () => {
    const onResetFilter = vi.fn();
    const user = userEvent.setup();
    server.use(recommendedHandlers.empty);
    renderWithProviders(
      createElement(AvatarList, {
        filter: defaultFilter,
        onAvatarClick: vi.fn(),
        onResetFilter,
      }),
      { onResetFilter }
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /필터 초기화/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /필터 초기화/ }));
    expect(onResetFilter).toHaveBeenCalledOnce();
  });

  it('행 클릭 시 onAvatarClick(id) 가 호출된다', async () => {
    const onAvatarClick = vi.fn();
    const user = userEvent.setup();
    server.use(recommendedHandlers.success);
    renderWithProviders(
      createElement(AvatarList, {
        filter: defaultFilter,
        onAvatarClick,
        onResetFilter: vi.fn(),
      }),
      { onAvatarClick }
    );

    await waitFor(() => {
      expect(screen.getByText('Moonlit')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Moonlit'));
    expect(onAvatarClick).toHaveBeenCalledWith('avatar-1');
  });

  it('"매칭" 버튼 클릭 시 DispatchModal 이 열린다', async () => {
    const user = userEvent.setup();
    server.use(recommendedHandlers.success);
    renderWithProviders(
      createElement(AvatarList, {
        filter: defaultFilter,
        onAvatarClick: vi.fn(),
        onResetFilter: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /매칭/ }).length).toBeGreaterThan(0);
    });

    const matchButtons = screen.getAllByRole('button', { name: /매칭/ });
    await user.click(matchButtons[0]!);

    await waitFor(() => {
      const dialog = screen.queryByRole('dialog');
      const matchText = screen.queryByText(/매칭하기/);
      expect(dialog !== null || matchText !== null).toBe(true);
    });
  });
});
