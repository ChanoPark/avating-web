import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { http, HttpResponse } from 'msw';
import { isApiError } from '@shared/lib/errors';
import { server } from '@shared/mocks/server';
import { simCandidatesHandlers } from '@shared/mocks/handlers/avatarCandidates';
import { useSimCandidatesSuspense } from '../useSimCandidates';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function createWrapper(onError: (error: Error) => void = () => undefined) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        ErrorBoundary,
        { fallback: createElement('div', null, 'error'), onError },
        createElement(Suspense, { fallback: createElement('div', null, 'loading') }, children)
      )
    );
  };
}

describe('useSimCandidatesSuspense', () => {
  it('후보 목록을 파싱해 돌려준다', async () => {
    server.use(simCandidatesHandlers.success);
    const { result } = renderHook(() => useSimCandidatesSuspense(8), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });
    expect(result.current.items.map((c) => c.name)).toEqual(['하늘', '봄날', 'Moonlit']);
    expect(result.current.items[1]?.canRequestSimulation).toBe(false);
  });

  it('size 를 쿼리 파라미터로 보낸다', async () => {
    let requestedSize: string | null = null;
    server.use(
      http.get(`${BASE_URL}/api/avatars/candidates`, ({ request }) => {
        requestedSize = new URL(request.url).searchParams.get('size');
        return HttpResponse.json({ data: { items: [], size: 0 } });
      })
    );
    const { result } = renderHook(() => useSimCandidatesSuspense(8), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });
    expect(requestedSize).toBe('8');
  });

  it('서버 오류는 에러 경계로 던진다', async () => {
    server.use(simCandidatesHandlers.serverError);
    const errors: Error[] = [];
    renderHook(() => useSimCandidatesSuspense(8), {
      wrapper: createWrapper((e) => {
        errors.push(e);
      }),
    });

    await waitFor(() => {
      expect(errors).toHaveLength(1);
    });
    const [error] = errors;
    expect(isApiError(error) && error.statusCode === 500).toBe(true);
  });
});
