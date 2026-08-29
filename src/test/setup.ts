import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '@shared/mocks/server';
import { useAuthStore } from '@entities/auth/store';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  // auth 스토어가 localStorage 에 persist 돼 한 파일 안의 테스트끼리 세션이 샌다 — 둘 다
  // 초기화한다.
  useAuthStore.setState(useAuthStore.getInitialState(), true);
  localStorage.clear();
});

afterAll(() => {
  server.close();
});
