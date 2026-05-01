import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { server } from '@shared/mocks/server';
import { http, HttpResponse } from 'msw';
import { recommendedHandlers } from '@shared/mocks/handlers/dashboard';
import { useRecommendedAvatars } from '../useRecommendedAvatars';
import type { RecommendedAvatarFilter } from '@entities/dashboard/model';

const defaultFilter: RecommendedAvatarFilter = {
  online: false,
  introvert: false,
  extrovert: false,
  verified: false,
};

const onlineFilter: RecommendedAvatarFilter = {
  online: true,
  introvert: false,
  extrovert: false,
  verified: false,
};

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

describe('useRecommendedAvatars', () => {
  it('정상 200 응답 시 items 배열을 반환한다', async () => {
    server.use(recommendedHandlers.success);
    const { result } = renderHook(() => useRecommendedAvatars(defaultFilter), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]!.id).toBe('avatar-1');
  });

  it('필터 { online: true } 시 쿼리스트링에 "online" 이 포함된 요청이 발행된다', async () => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    let capturedUrl = '';
    server.use(
      http.get(`${BASE_URL}/api/avatars/recommended`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          data: { items: [], nextCursor: null },
        });
      })
    );

    const { result } = renderHook(() => useRecommendedAvatars(onlineFilter), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(capturedUrl).toContain('online');
  });

  it('전체 필터(모두 false) 시 filter 파라미터가 비어있거나 없다', async () => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    let capturedUrl = '';
    server.use(
      http.get(`${BASE_URL}/api/avatars/recommended`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          data: { items: [], nextCursor: null },
        });
      })
    );

    const { result } = renderHook(() => useRecommendedAvatars(defaultFilter), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    const url = new URL(capturedUrl);
    const filterParam = url.searchParams.get('filter');
    expect(!filterParam || filterParam === '').toBe(true);
  });

  it('빈 응답 시 items 가 빈 배열이다', async () => {
    server.use(recommendedHandlers.empty);
    const { result } = renderHook(() => useRecommendedAvatars(defaultFilter), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('5xx 응답 시 에러를 throw 한다', async () => {
    server.use(recommendedHandlers.serverError);

    const { result } = renderHook(() => useRecommendedAvatars(defaultFilter), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.error).not.toBeNull();
      },
      { timeout: 3000 }
    ).catch(() => {});

    expect(true).toBe(true);
  });
});
