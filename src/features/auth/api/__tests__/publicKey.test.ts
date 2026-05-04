import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@shared/mocks/server';
import { publicKeyHandlers } from '@shared/mocks/handlers/auth';
import { usePublicKey, fetchPublicKey, ensurePublicKey } from '../publicKey';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

describe('fetchPublicKey', () => {
  it('정상 응답 시 publicKey 문자열을 반환한다', async () => {
    server.use(publicKeyHandlers.success);
    const key = await fetchPublicKey();
    expect(key).toBe('mock-rsa-public-key');
  });

  it('서버 오류 시 에러를 throw 한다', async () => {
    server.use(publicKeyHandlers.serverError);
    await expect(fetchPublicKey()).rejects.toThrow();
  });
});

describe('ensurePublicKey', () => {
  beforeEach(() => {
    server.use(publicKeyHandlers.success);
  });

  it('정상 응답 시 publicKey 문자열을 반환한다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const key = await ensurePublicKey(queryClient);
    expect(key).toBe('mock-rsa-public-key');
  });

  it('두 번 호출 시 캐시에서 반환하고 네트워크 요청은 1회만 발생한다', async () => {
    let callCount = 0;
    const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.get(`${BASE_URL}/api/crypto/public-key`, () => {
        callCount++;
        return HttpResponse.json({ data: { publicKey: 'cached-key' } });
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await ensurePublicKey(queryClient);
    await ensurePublicKey(queryClient);
    expect(callCount).toBe(1);
  });
});

describe('usePublicKey', () => {
  it('정상 응답 시 data 에 publicKey 문자열이 반환된다', async () => {
    server.use(publicKeyHandlers.success);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePublicKey(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toBe('mock-rsa-public-key');
  });

  it('서버 오류 시 isError 가 true 가 된다', async () => {
    server.use(publicKeyHandlers.serverError);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePublicKey(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('두 번 마운트해도 요청이 1회만 발생한다 (staleTime)', async () => {
    server.use(publicKeyHandlers.success);
    const { queryClient, wrapper } = createWrapper();

    const { result: r1 } = renderHook(() => usePublicKey(), { wrapper });
    await waitFor(() => expect(r1.current.data).toBeDefined());

    const { result: r2 } = renderHook(() => usePublicKey(), { wrapper });
    await waitFor(() => expect(r2.current.data).toBeDefined());

    expect(queryClient.getQueryCache().findAll()).toHaveLength(1);
  });
});
