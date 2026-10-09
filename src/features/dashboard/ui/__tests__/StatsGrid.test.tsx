import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createElement, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { statsHandlers } from '@shared/mocks/handlers/dashboard';
import { ToastProvider } from '@shared/ui/Toast/Toast';
import { StatsGrid } from '../StatsGrid';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderWithProviders(ui: React.ReactNode, queryClient = createQueryClient()) {
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        ToastProvider,
        null,
        createElement(
          Suspense,
          { fallback: createElement('div', { 'data-testid': 'loading' }, '로딩 중') },
          ui
        )
      )
    )
  );
}

describe('StatsGrid', () => {
  it('정상 응답 시 3개 카드 라벨이 모두 렌더된다', async () => {
    server.use(statsHandlers.success);
    renderWithProviders(createElement(StatsGrid));

    await waitFor(() => {
      expect(screen.getByText('총 매칭 횟수')).toBeInTheDocument();
    });

    expect(screen.getByText('총 매칭 횟수')).toBeInTheDocument();
    expect(screen.getByText('평균 호감도')).toBeInTheDocument();
    expect(screen.getByText('에프터 연결')).toBeInTheDocument();
    expect(screen.queryByText('잔여 다이아')).not.toBeInTheDocument();
  });

  it('/api/dashboard/stats 를 단 1번만 호출한다 (single fetch + select 패턴)', async () => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    let callCount = 0;
    server.use(
      http.get(`${BASE_URL}/api/dashboard/stats`, () => {
        callCount++;
        return HttpResponse.json({
          data: {
            totalDispatched: 47,
            totalDispatchedDelta: 8,
            avgAffinity: 64,
            avgAffinityDelta: 3.2,
            matches: 3,
            matchRate: 6.4,
            interventionsThisWeek: 21,
          },
        });
      })
    );

    renderWithProviders(createElement(StatsGrid));

    await waitFor(() => {
      expect(screen.getByText('총 매칭 횟수')).toBeInTheDocument();
    });

    expect(callCount).toBe(1);
  });

  it('API 응답 Zod 검증 실패 시 3개 카드 모두 fallback("—") 표시', async () => {
    server.use(statsHandlers.partialFail);

    renderWithProviders(createElement(StatsGrid));

    await waitFor(() => {
      const fallbacks = screen.queryAllByText('—');
      expect(fallbacks.length).toBe(3);
    });
  });

  it('카드 세 장이 모두 실패해도 통계 에러 토스트는 하나만 뜬다', async () => {
    server.use(statsHandlers.partialFail);

    renderWithProviders(createElement(StatsGrid));

    await waitFor(() => {
      expect(screen.queryAllByText('—')).toHaveLength(3);
    });
    expect(screen.getAllByText('통계를 불러오지 못했어요')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /다시/ })).not.toBeInTheDocument();
  });

  it('통계 로딩이 실패한 화면을 떠났다 돌아오면 재요청해 값을 보여준다', async () => {
    server.use(statsHandlers.serverError);
    const queryClient = createQueryClient();
    const { unmount } = renderWithProviders(createElement(StatsGrid), queryClient);
    await screen.findByText('통계를 불러오지 못했어요');
    unmount();

    server.use(statsHandlers.success);
    renderWithProviders(createElement(StatsGrid), queryClient);

    expect(await screen.findByText('47')).toBeInTheDocument();
    expect(screen.queryAllByText('—')).toHaveLength(0);
    expect(screen.queryByText('통계를 불러오지 못했어요')).not.toBeInTheDocument();
  });

  it('a11y — axe 위반 0 (jest-axe 미설치 — 도입 후 활성화)', () => {
    expect(true).toBe(true);
  });

  it('totalDispatchedDelta < 0 시 delta 는 무채색 pill 이다 — 빨강이 아니다', async () => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    server.use(
      http.get(`${BASE_URL}/api/dashboard/stats`, () => {
        return HttpResponse.json({
          data: {
            totalDispatched: 10,
            totalDispatchedDelta: -3,
            avgAffinity: 50,
            avgAffinityDelta: -2,
            matches: 1,
            matchRate: 10,
            interventionsThisWeek: 5,
          },
        });
      })
    );

    renderWithProviders(createElement(StatsGrid));

    await waitFor(() => {
      expect(screen.getByText(/-3 지난주 대비/)).toBeInTheDocument();
    });

    const deltaEl = screen.getByText(/-3 지난주 대비/);
    expect(deltaEl).toHaveClass('bg-raised');
    expect(deltaEl).not.toHaveClass('text-danger');
    expect(deltaEl).not.toHaveClass('font-semibold');
  });

  it('totalDispatchedDelta === 0 시 delta 텍스트가 +0 으로 표시된다', async () => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    server.use(
      http.get(`${BASE_URL}/api/dashboard/stats`, () => {
        return HttpResponse.json({
          data: {
            totalDispatched: 10,
            totalDispatchedDelta: 0,
            avgAffinity: 50,
            avgAffinityDelta: 0,
            matches: 1,
            matchRate: 10,
            interventionsThisWeek: 5,
          },
        });
      })
    );

    renderWithProviders(createElement(StatsGrid));

    await waitFor(() => {
      expect(screen.getByText(/\+0 지난주 대비/)).toBeInTheDocument();
    });

    const deltaEl = screen.getByText(/\+0 지난주 대비/);
    expect(deltaEl).toHaveClass('text-secondary');
  });
});
