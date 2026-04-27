import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { server } from '@shared/mocks/server';
import { signupHandlers, publicKeyHandlers } from '@shared/mocks/handlers/auth';
import { useAuthStore } from '@entities/auth/store';
import { useSignup } from '../api/useSignup';

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

describe('useSignup', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
  });

  it('회원가입 성공 시 authStore에 accessToken이 ��장된다', async () => {
    server.use(publicKeyHandlers.success, signupHandlers.success);

    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

    result.current.mutate({
      email: 'newuser@avating.com',
      nickname: '새유저',
      password: 'Password1!',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(useAuthStore.getState().accessToken).toBe('test-access-token');
  });

  it('회원가입 성공 시 isAuthenticated()가 true가 된다', async () => {
    server.use(publicKeyHandlers.success, signupHandlers.success);

    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

    result.current.mutate({
      email: 'newuser@avating.com',
      nickname: '새유저',
      password: 'Password1!',
    });

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    });
  });

  it('409 EMAIL_CONFLICT 응답 시 mutation이 에러 ��태가 된다', async () => {
    server.use(publicKeyHandlers.success, signupHandlers.emailConflict);

    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

    result.current.mutate({
      email: 'existing@avating.com',
      nickname: '새유저',
      password: 'Password1!',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('409 EMAIL_CONFLICT 에러 객체에 statusCode 409가 있다', async () => {
    server.use(publicKeyHandlers.success, signupHandlers.emailConflict);

    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

    result.current.mutate({
      email: 'existing@avating.com',
      nickname: '새유저',
      password: 'Password1!',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const error = result.current.error;
    expect(error).toBeDefined();
    if (error && 'statusCode' in error) {
      expect(error.statusCode).toBe(409);
    }
  });

  it('409 NICKNAME_CONFLICT 응답 시 에러 코드가 NICKNAME_CONFLICT이다', async () => {
    server.use(publicKeyHandlers.success, signupHandlers.nicknameConflict);

    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

    result.current.mutate({
      email: 'user@avating.com',
      nickname: '이미��는닉��임',
      password: 'Password1!',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const error = result.current.error;
    if (error && 'code' in error) {
      expect(error.code).toBe('NICKNAME_CONFLICT');
    }
  });

  it('422 응답 시 mutation이 에러 상태가 된다', async () => {
    server.use(publicKeyHandlers.success, signupHandlers.passwordPolicyViolation);

    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

    result.current.mutate({
      email: 'user@avating.com',
      nickname: '새유저',
      password: 'weakpassword',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const error = result.current.error;
    if (error && 'statusCode' in error) {
      expect(error.statusCode).toBe(422);
    }
  });
});
