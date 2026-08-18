import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@shared/mocks/server';
import { primaryAvatarHandlers } from '@shared/mocks/handlers/primaryAvatar';
import { useOnboardingCompletion } from '../useOnboardingCompletion';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
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
});
