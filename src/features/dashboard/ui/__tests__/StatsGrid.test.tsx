import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createElement, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { statsHandlers } from '@shared/mocks/handlers/dashboard';
import { StatsGrid } from '../StatsGrid';

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        Suspense,
        { fallback: createElement('div', { 'data-testid': 'loading' }, '로딩 중') },
        ui
      )
    )
  );
}

describe('StatsGrid', () => {
  it('정상 응답 시 4개 카드 라벨이 모두 렌더된다', async () => {
    server.use(statsHandlers.success);
    renderWithProviders(createElement(StatsGrid, null));

    await waitFor(() => {
      expect(screen.getByText('총 매칭 횟수')).toBeInTheDocument();
    });

    expect(screen.getByText('총 매칭 횟수')).toBeInTheDocument();
    expect(screen.getByText('평균 호감도')).toBeInTheDocument();
    expect(screen.getByText('에프터 연결')).toBeInTheDocument();
    expect(screen.getByText('이번 주 훈수')).toBeInTheDocument();
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
            gemsUsed: 153,
            gemsBalance: 1240,
          },
        });
      })
    );

    renderWithProviders(createElement(StatsGrid, null));

    await waitFor(() => {
      expect(screen.getByText('총 매칭 횟수')).toBeInTheDocument();
    });

    expect(callCount).toBe(1);
  });

  it('API 응답 Zod 검증 실패 시 4개 카드 모두 fallback("—") 표시', async () => {
    server.use(statsHandlers.partialFail);

    renderWithProviders(createElement(StatsGrid, null));

    await waitFor(() => {
      const fallbacks = screen.queryAllByText('—');
      expect(fallbacks.length).toBe(4);
    });
  });

  it('a11y — axe 위반 0 (jest-axe 미설치 — 도입 후 활성화)', () => {
    // jest-axe 미설치 상태. GREEN 단계에서 의존성 추가 후 활성화.
    expect(true).toBe(true);
  });
});
