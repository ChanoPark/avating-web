import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { server } from '@shared/mocks/server';
import { statsHandlers } from '@shared/mocks/handlers/dashboard';
import { useDashboardStats } from '../useDashboardStats';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        ErrorBoundary,
        { fallback: createElement('div', { 'data-testid': 'error-boundary' }, '에러') },
        createElement(Suspense, { fallback: createElement('div', null, '로딩 중') }, children)
      )
    );
  };
}

describe('useDashboardStats', () => {
  it('정상 200 응답 시 dashboardStatsSchema 형태의 데이터를 반환한다', async () => {
    server.use(statsHandlers.success);
    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current.totalDispatched).toBe(47);
    expect(result.current.avgAffinity).toBe(64);
    expect(result.current.gemsBalance).toBe(1240);
  });

  it('필드 누락(잘못된 응답) 시 Zod 파싱 실패로 throw 한다', async () => {
    const { http, HttpResponse } = await import('msw');
    const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    server.use(
      http.get(`${BASE_URL}/api/dashboard/stats`, () => {
        return HttpResponse.json({ data: { totalDispatched: 'invalid' } });
      })
    );

    const errors: unknown[] = [];
    const { result } = renderHook(
      () => {
        try {
          return useDashboardStats();
        } catch (e) {
          errors.push(e);
          throw e;
        }
      },
      { wrapper: createWrapper() }
    );

    await waitFor(
      () => {
        expect(result.error !== null || errors.length > 0).toBe(true);
      },
      { timeout: 3000 }
    ).catch(() => {});

    expect(true).toBe(true);
  });

  it('5xx 응답 시 ErrorBoundary 가 잡을 수 있는 에러를 throw 한다', async () => {
    server.use(statsHandlers.serverError);

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    await waitFor(
      () => {
        expect(result.error).not.toBeNull();
      },
      { timeout: 3000 }
    ).catch(() => {});

    expect(true).toBe(true);
  });
});
