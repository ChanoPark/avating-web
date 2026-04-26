import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { server } from '@shared/mocks/server';
import { loginHandlers, publicKeyHandlers } from '@shared/mocks/handlers/auth';
import { useAuthStore } from '@entities/auth/store';
import { useLogin } from '../api/useLogin';

vi.mock('../lib/encryptPassword', () => ({
  encryptPassword: vi.fn(() => 'mock-encrypted-password'),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useLogin', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
  });

  it('로그인 성공 시 authStore에 setToken이 호출된다', async () => {
    server.use(publicKeyHandlers.success, loginHandlers.success);

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ email: 'user@avating.com', password: 'Password1!' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(useAuthStore.getState().accessToken).toBe('test-access-token');
  });

  it('로그인 성공 시 accessToken이 스토어에 저장된다', async () => {
    server.use(publicKeyHandlers.success, loginHandlers.success);

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ email: 'user@avating.com', password: 'Password1!' });

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    });
  });

  it('404 응답 시 mutation이 에러 상태가 된다', async () => {
    server.use(publicKeyHandlers.success, loginHandlers.notFound);

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ email: 'wrong@avating.com', password: 'WrongPass1!' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('404 응답 시 에러 메시지가 한국어로 제공된다', async () => {
    server.use(publicKeyHandlers.success, loginHandlers.notFound);

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ email: 'wrong@avating.com', password: 'WrongPass1!' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toMatch(
      /이메일 또는 비밀번호가 올바르지 않습니다|회원을 찾을 수 없습니다/
    );
  });

  it('422 응답 시 RSA 에러 메시지가 제공된다', async () => {
    server.use(publicKeyHandlers.success, loginHandlers.rsaFailure);

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ email: 'user@avating.com', password: 'Password1!' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBeDefined();
  });

  it('publicKey 조회 후 암호화하여 로그인 요청을 보낸다', async () => {
    const { encryptPassword } = await import('../lib/encryptPassword');
    server.use(publicKeyHandlers.success, loginHandlers.success);

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ email: 'user@avating.com', password: 'Password1!' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(encryptPassword).toHaveBeenCalledWith('Password1!', 'mock-rsa-public-key');
  });
});
