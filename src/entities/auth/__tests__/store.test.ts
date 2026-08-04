import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AUTH_STORAGE_KEY, useAuthStore } from '../store';

const mockToken = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('setToken() 후 토큰이 localStorage 에 영속화된다', () => {
    useAuthStore.getState().setToken(mockToken);

    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const persisted = JSON.parse(raw ?? '{}') as { state?: Record<string, unknown> };
    expect(persisted.state?.accessToken).toBe('test-access-token');
    expect(persisted.state?.refreshToken).toBe('test-refresh-token');
  });

  it('영속화 대상은 토큰 4개 필드뿐이다 (status·액션은 저장하지 않는다)', () => {
    useAuthStore.getState().setToken(mockToken);

    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const persisted = JSON.parse(raw ?? '{}') as { state?: Record<string, unknown> };
    expect(Object.keys(persisted.state ?? {}).sort()).toEqual([
      'accessToken',
      'expiresAt',
      'refreshToken',
      'tokenType',
    ]);
  });

  it('clear() 후 영속화된 토큰도 비워진다', () => {
    useAuthStore.getState().setToken(mockToken);
    useAuthStore.getState().clear();

    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const persisted = JSON.parse(raw ?? '{}') as { state?: Record<string, unknown> };
    expect(persisted.state?.accessToken).toBeNull();
    expect(persisted.state?.refreshToken).toBeNull();
  });

  it('localStorage 쓰기가 막혀도 setToken() 은 성공한다 (사파리 프라이빗 모드)', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(() => {
      useAuthStore.getState().setToken(mockToken);
    }).not.toThrow();
    expect(useAuthStore.getState().accessToken).toBe('test-access-token');
    expect(useAuthStore.getState().status).toBe('authenticated');

    setItemSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('초기 status 는 restoring 이다 (부팅 복구 판정 전)', () => {
    expect(useAuthStore.getInitialState().status).toBe('restoring');
  });

  it('setToken() 후 status 는 authenticated 다', () => {
    useAuthStore.getState().setToken(mockToken);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('clear() 후 status 는 anonymous 다', () => {
    useAuthStore.getState().setToken(mockToken);
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('setStatus() 는 토큰을 건드리지 않고 상태만 바꾼다', () => {
    useAuthStore.getState().setToken(mockToken);
    useAuthStore.getState().setStatus('restoring');

    expect(useAuthStore.getState().status).toBe('restoring');
    expect(useAuthStore.getState().accessToken).toBe('test-access-token');
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
