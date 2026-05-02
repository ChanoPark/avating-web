import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCountdown, isExpired } from '../lib/countdown';

describe('formatCountdown', () => {
  it('90초 남았을 때 "01:30" 을 반환한다', () => {
    const now = new Date('2026-05-01T10:00:00.000Z').getTime();
    const expiresAt = new Date(now + 90 * 1000).toISOString();

    expect(formatCountdown(expiresAt, now)).toBe('01:30');
  });

  it('60초 남았을 때 "01:00" 을 반환한다', () => {
    const now = new Date('2026-05-01T10:00:00.000Z').getTime();
    const expiresAt = new Date(now + 60 * 1000).toISOString();

    expect(formatCountdown(expiresAt, now)).toBe('01:00');
  });

  it('1초 남았을 때 "00:01" 을 반환한다', () => {
    const now = new Date('2026-05-01T10:00:00.000Z').getTime();
    const expiresAt = new Date(now + 1 * 1000).toISOString();

    expect(formatCountdown(expiresAt, now)).toBe('00:01');
  });

  it('0초 (만료) 일 때 "00:00" 을 반환한다', () => {
    const now = new Date('2026-05-01T10:00:00.000Z').getTime();
    const expiresAt = new Date(now).toISOString();

    expect(formatCountdown(expiresAt, now)).toBe('00:00');
  });

  it('만료 이후에도 "00:00" 을 반환한다 (음수 클램핑)', () => {
    const now = new Date('2026-05-01T10:00:00.000Z').getTime();
    const expiresAt = new Date(now - 5000).toISOString();

    expect(formatCountdown(expiresAt, now)).toBe('00:00');
  });

  it('10분 남았을 때 "10:00" 을 반환한다', () => {
    const now = new Date('2026-05-01T10:00:00.000Z').getTime();
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();

    expect(formatCountdown(expiresAt, now)).toBe('10:00');
  });

  it('분/초 자릿수가 2자리로 zero-padding 된다', () => {
    const now = new Date('2026-05-01T10:00:00.000Z').getTime();
    const expiresAt = new Date(now + 9 * 60 * 1000 + 5 * 1000).toISOString();

    expect(formatCountdown(expiresAt, now)).toBe('09:05');
  });
});

describe('isExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expiresAt 이 현재 시각 이후이면 false 를 반환한다', () => {
    const now = new Date('2026-05-01T10:00:00.000Z');
    vi.setSystemTime(now);

    const expiresAt = new Date(now.getTime() + 60 * 1000).toISOString();

    expect(isExpired(expiresAt)).toBe(false);
  });

  it('expiresAt 이 현재 시각과 동일하면 true 를 반환한다', () => {
    const now = new Date('2026-05-01T10:00:00.000Z');
    vi.setSystemTime(now);

    const expiresAt = new Date(now.getTime()).toISOString();

    expect(isExpired(expiresAt)).toBe(true);
  });

  it('expiresAt 이 현재 시각 이전이면 true 를 반환한다', () => {
    const now = new Date('2026-05-01T10:00:00.000Z');
    vi.setSystemTime(now);

    const expiresAt = new Date(now.getTime() - 1000).toISOString();

    expect(isExpired(expiresAt)).toBe(true);
  });
});
