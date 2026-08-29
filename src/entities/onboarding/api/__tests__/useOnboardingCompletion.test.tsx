import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@shared/mocks/server';
import { primaryAvatarHandlers } from '@shared/mocks/handlers/primaryAvatar';
import { avatarKeys } from '@entities/avatar';
import { useOnboardingCompletion } from '../useOnboardingCompletion';

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function createWrapper(queryClient: QueryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useOnboardingCompletion — 완료 판정은 대표 아바타 보유 여부로 한다', () => {
  it('판정이 끝나기 전에는 isResolved 가 false 다', () => {
    server.use(primaryAvatarHandlers.none);
    const { result } = renderHook(() => useOnboardingCompletion(), { wrapper: createWrapper() });

    expect(result.current.isResolved).toBe(false);
    expect(result.current.hasPrimaryAvatar).toBe(false);
  });

  it('대표 아바타가 있으면 완료로 본다', async () => {
    server.use(primaryAvatarHandlers.success);
    const { result } = renderHook(() => useOnboardingCompletion(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true);
    });
    expect(result.current.hasPrimaryAvatar).toBe(true);
    expect(result.current.isUnknown).toBe(false);
  });

  it('대표 아바타가 없으면(404) 미완료로 본다', async () => {
    server.use(primaryAvatarHandlers.none);
    const { result } = renderHook(() => useOnboardingCompletion(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true);
    });
    expect(result.current.hasPrimaryAvatar).toBe(false);
    expect(result.current.isUnknown).toBe(false);
  });

  it('조회가 실패하면(서버 오류) 미완료로 폴백한다', async () => {
    server.use(primaryAvatarHandlers.serverError);
    const { result } = renderHook(() => useOnboardingCompletion(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true);
    });
    expect(result.current.hasPrimaryAvatar).toBe(false);
  });

  it('서버 오류는 "확인 못 함"으로 구분해서 알려준다', async () => {
    server.use(primaryAvatarHandlers.serverError);
    const { result } = renderHook(() => useOnboardingCompletion(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true);
    });
    expect(result.current.isUnknown).toBe(true);
  });

  describe('enabled 스위치', () => {
    it('enabled:false 면 조회 자체를 걸지 않는다', () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useOnboardingCompletion({ enabled: false }), {
        wrapper: createWrapper(queryClient),
      });

      // pending + idle 조합이 "한 번도 요청 안 함"을 뜻한다 — 캐시에는 올라가지만 요청은 안 나간다.
      const state = queryClient.getQueryState(avatarKeys.primary());
      expect(state?.fetchStatus).toBe('idle');
      expect(state?.status).toBe('pending');
      expect(result.current.isResolved).toBe(false);
    });

    it('enabled:true 면 평소대로 조회한다', async () => {
      server.use(primaryAvatarHandlers.success);
      const { result } = renderHook(() => useOnboardingCompletion({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isResolved).toBe(true);
      });
      expect(result.current.hasPrimaryAvatar).toBe(true);
    });
  });
});
