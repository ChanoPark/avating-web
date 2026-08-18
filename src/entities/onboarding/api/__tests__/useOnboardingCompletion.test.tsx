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

  // 완료로 잘못 판정하면 온보딩 진입 자체가 막혀 사용자가 스스로 빠져나올 수 없다.
  // 확인에 실패하면 미완료 쪽으로 떨어뜨려 최소한 온보딩은 계속할 수 있게 한다.
  it('조회가 실패하면(서버 오류) 미완료로 폴백한다', async () => {
    server.use(primaryAvatarHandlers.serverError);
    const { result } = renderHook(() => useOnboardingCompletion(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true);
    });
    expect(result.current.hasPrimaryAvatar).toBe(false);
  });

  // "확인해보니 없다"(404) 와 "확인을 못 했다"(500) 는 다르다. 뒤섞으면 완료 화면이
  // 판정 실패만으로 사용자를 되돌려보내 리다이렉트 루프가 된다.
  it('서버 오류는 "확인 못 함"으로 구분해서 알려준다', async () => {
    server.use(primaryAvatarHandlers.serverError);
    const { result } = renderHook(() => useOnboardingCompletion(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true);
    });
    expect(result.current.isUnknown).toBe(true);
  });

  // 랜딩처럼 비로그인 방문자도 보는 화면에서 이 훅을 쓰면, 스위치가 없는 한 토큰 없이
  // `/api/avatars/primary` 를 때려 401 → refresh 인터셉터 → clear() 왕복이 생긴다.
  describe('enabled 스위치', () => {
    it('enabled:false 면 조회 자체를 걸지 않는다', () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useOnboardingCompletion({ enabled: false }), {
        wrapper: createWrapper(queryClient),
      });

      // 꺼진 쿼리도 캐시에는 올라가지만 요청은 나가지 않는다 — `pending` + `idle` 조합이
      // "한 번도 요청한 적 없음" 이다.
      const state = queryClient.getQueryState(avatarKeys.primary());
      expect(state?.fetchStatus).toBe('idle');
      expect(state?.status).toBe('pending');
      // 조회를 안 했으니 "판정 끝남" 으로 읽혀서도 안 된다.
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
