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
  // auth 스토어가 localStorage 에 persist 되므로 같은 파일 안의 테스트끼리 세션이 샌다.
  // 스토어와 저장소를 함께 초기 상태로 되돌린다.
  useAuthStore.setState(useAuthStore.getInitialState(), true);
  localStorage.clear();
});

afterAll(() => {
  server.close();
});
