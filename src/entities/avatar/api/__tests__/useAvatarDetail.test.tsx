import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAvatarDetail } from '../useAvatarDetail';
import {
  resetAvatarDetailScenario,
  setAvatarDetailScenario,
} from '@shared/mocks/handlers/avatarDetail';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  resetAvatarDetailScenario();
});

afterEach(() => {
  resetAvatarDetailScenario();
});

describe('useAvatarDetail', () => {
  it('성공 시 6축 stats 와 세션 이력을 반환한다', async () => {
    const { result } = renderHook(() => useAvatarDetail('avatar-1'), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.stats.empathy).toBe(81);
    expect(result.current.data?.sessionHistory).toHaveLength(2);
  });

  it('빈 id 면 호출하지 않는다 (enabled=false 효과)', () => {
    const { result } = renderHook(() => useAvatarDetail(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('404 응답은 isError true 로 surface 된다', async () => {
    setAvatarDetailScenario('not-found');
    const { result } = renderHook(() => useAvatarDetail('avatar-1'), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.statusCode).toBe(404);
  });
});
