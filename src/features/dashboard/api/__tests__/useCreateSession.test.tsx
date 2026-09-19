import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@shared/mocks/server';
import { sessionHandlers } from '@shared/mocks/handlers/dashboard';
import { mockSimCandidates } from '@shared/mocks/handlers/avatarCandidates';
import { dashboardKeys } from '@entities/dashboard/queryKeys';
import { avatarKeys } from '@entities/avatar';
import type { AvatarSimCandidateList } from '@entities/avatar';
import { useCreateSession } from '../useCreateSession';

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCreateSession', () => {
  it('201 응답 시 sessionId 를 반환한다', async () => {
    server.use(sessionHandlers.success);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useCreateSession(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ avatarId: 'avatar-1' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.sessionId).toBe('session-123');
  });

  it('onSuccess 후 dashboardKeys.all 이 invalidate 된다', async () => {
    server.use(sessionHandlers.success);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSession(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ avatarId: 'avatar-1' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: dashboardKeys.all })
    );
  });

  // 후보 목록은 랜덤 조회라 무효화해 다시 받으면 카드가 섞인다 — 요청한 후보만 요청 불가로 바꾼다.
  it('onSuccess 후 요청한 후보만 canRequestSimulation=false 로 바뀌고 나머지와 순서는 그대로다', async () => {
    server.use(sessionHandlers.success);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData<AvatarSimCandidateList>(
      avatarKeys.candidates(8),
      mockSimCandidates.data
    );
    const [target] = mockSimCandidates.data.items;

    const { result } = renderHook(() => useCreateSession(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ avatarId: target!.avatarId });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const list = queryClient.getQueryData<AvatarSimCandidateList>(avatarKeys.candidates(8));
    expect(list?.items.map((c) => c.avatarId)).toEqual(
      mockSimCandidates.data.items.map((c) => c.avatarId)
    );
    expect(list?.items.map((c) => c.canRequestSimulation)).toEqual([false, false, true]);
    // 캐시 원본 객체를 고치지 않는다 — 새 객체로 교체해야 구독 컴포넌트가 다시 그린다.
    expect(mockSimCandidates.data.items[0]?.canRequestSimulation).toBe(true);
  });

  it('500 응답 시 일반 ApiError 를 반환한다', async () => {
    server.use(sessionHandlers.serverError);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useCreateSession(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ avatarId: 'avatar-1' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const error = result.current.error;
    expect(error?.statusCode).toBe(500);
  });
});
