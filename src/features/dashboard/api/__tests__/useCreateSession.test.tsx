import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@shared/mocks/server';
import { sessionHandlers } from '@shared/mocks/handlers/dashboard';
import { dashboardKeys } from '@entities/dashboard/queryKeys';
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

  it('402 INSUFFICIENT_GEMS 응답 시 statusCode 와 code 가 에러에 포함된다', async () => {
    server.use(sessionHandlers.insufficientGems);
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
    expect(error).not.toBeNull();
    expect(error?.statusCode).toBe(402);
    expect(error?.code).toBe('INSUFFICIENT_GEMS');
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
