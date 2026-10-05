import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { ownedAvatarsHandlers } from '@shared/mocks/handlers/ownedAvatars';
import { useMyAvatars } from '../useMyAvatars';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useMyAvatars', () => {
  it('GET /api/avatars/me 응답의 content 를 목록으로 돌려준다', async () => {
    server.use(ownedAvatarsHandlers.success);
    const { result } = renderHook(() => useMyAvatars(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.map((a) => a.name)).toEqual(['hyunwoo', 'hyun_night', 'hyunsoft']);
    expect(result.current.data?.[1]?.canJoinSimulation).toBe(false);
  });

  it('서버 최대치(size=50) 한 페이지만 요청하고 cursor 는 보내지 않는다', async () => {
    let params: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/api/avatars/me`, ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ data: { content: [], hasNext: false } });
      })
    );
    const { result } = renderHook(() => useMyAvatars(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(params?.get('size')).toBe('50');
    expect(params?.has('cursor')).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('서버 오류면 ApiError 로 실패한다', async () => {
    server.use(ownedAvatarsHandlers.serverError);
    const { result } = renderHook(() => useMyAvatars(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.statusCode).toBe(500);
  });

  it('enabled=false 면 요청하지 않는다', () => {
    const { result } = renderHook(() => useMyAvatars({ enabled: false }), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
