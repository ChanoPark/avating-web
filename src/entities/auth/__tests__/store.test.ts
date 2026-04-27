import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../store';

const mockToken = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
  });

  it('초기 상태에서 isAuthenticated()는 false를 반환한다', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('setToken() 호출 후 accessToken이 존재한다', () => {
    useAuthStore.getState().setToken(mockToken);
    expect(useAuthStore.getState().accessToken).toBe('test-access-token');
  });

  it('setToken() 호출 후 isAuthenticated()는 true를 반환한다', () => {
    useAuthStore.getState().setToken(mockToken);
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('setToken() 호출 후 expiresAt은 현재 시각 + expiresIn * 1000이다', () => {
    vi.useFakeTimers();
    const now = new Date('2026-04-25T00:00:00Z').getTime();
    vi.setSystemTime(now);

    useAuthStore.getState().setToken(mockToken);

    expect(useAuthStore.getState().expiresAt).toBe(now + mockToken.expiresIn * 1000);

    vi.useRealTimers();
  });

  it('clear() 호출 후 모든 필드가 null이 된다', () => {
    useAuthStore.getState().setToken(mockToken);
    useAuthStore.getState().clear();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.tokenType).toBeNull();
    expect(state.expiresAt).toBeNull();
  });

  it('clear() 후 isAuthenticated()는 false를 반환한다', () => {
    useAuthStore.getState().setToken(mockToken);
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('localStorage.setItem이 호출되지 않는다 (메모리 전용 스토어)', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    useAuthStore.getState().setToken(mockToken);
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  it('accessToken이 있지만 expiresAt이 null이면 isAuthenticated()는 false를 반환한다', () => {
    useAuthStore.getState().setToken(mockToken);
    useAuthStore.setState({ expiresAt: null });
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('expiresAt이 현재 시각보다 과거이면 isAuthenticated()는 false를 반환한다', () => {
    vi.useFakeTimers();
    const now = new Date('2026-04-25T00:00:00Z').getTime();
    vi.setSystemTime(now);

    useAuthStore.getState().setToken(mockToken);
    useAuthStore.setState({ expiresAt: now - 1 });

    expect(useAuthStore.getState().isAuthenticated()).toBe(false);

    vi.useRealTimers();
  });
});
