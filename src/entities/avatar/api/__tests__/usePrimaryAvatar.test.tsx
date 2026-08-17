import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@shared/mocks/server';
import { primaryAvatarHandlers } from '@shared/mocks/handlers/primaryAvatar';
import { usePrimaryAvatar } from '../usePrimaryAvatar';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('usePrimaryAvatar', () => {
  it('대표 아바타가 있으면 요약 정보를 파싱해 돌려준다', async () => {
    server.use(primaryAvatarHandlers.success);
    const { result } = renderHook(() => usePrimaryAvatar(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(result.current.data?.name).toBe('루시');
    expect(result.current.data?.stats.OPENNESS).toBe(72.5);
  });

  // 404 는 "아직 대표 아바타가 없다" 는 정상 상태다. 오류로 던지면 호출부가
  // 서버 장애와 구분할 수 없어진다.
  it('404 는 오류가 아니라 null 로 돌려준다', async () => {
    server.use(primaryAvatarHandlers.none);
    const { result } = renderHook(() => usePrimaryAvatar(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('그 밖의 오류(500)는 오류로 남긴다', async () => {
    server.use(primaryAvatarHandlers.serverError);
    const { result } = renderHook(() => usePrimaryAvatar(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.data).toBeUndefined();
  });
});
