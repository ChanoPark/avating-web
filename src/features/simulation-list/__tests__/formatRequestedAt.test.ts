import { describe, it, expect } from 'vitest';
import { formatRequestedAt } from '../lib/formatRequestedAt';

const NOW = Date.parse('2026-07-27T12:00:00+09:00');

describe('formatRequestedAt', () => {
  it.each([
    ['2026-07-27T11:59:30+09:00', '방금'],
    ['2026-07-27T11:20:00+09:00', '40분 전'],
    ['2026-07-27T11:00:01+09:00', '59분 전'],
    ['2026-07-27T11:00:00+09:00', '1시간 전'],
    ['2026-07-27T10:50:00+09:00', '1시간 전'],
    ['2026-07-27T10:00:00+09:00', '2시간 전'],
    ['2026-07-26T10:48:00+09:00', '1일 1시간 전'],
    ['2026-07-26T11:48:00+09:00', '1일 전'],
    ['2026-07-25T12:00:00+09:00', '2일 전'],
    ['2026-07-19T12:01:00+09:00', '7일 23시간 전'],
    ['2026-07-19T12:00:00+09:00', '오래 전'],
    ['2026-01-01T00:00:00+09:00', '오래 전'],
  ])('%s → %s', (requestedAt, expected) => {
    expect(formatRequestedAt(requestedAt, NOW)).toBe(expected);
  });

  it('오프셋이 달라도 같은 시각이면 같은 값이다', () => {
    expect(formatRequestedAt('2026-07-27T02:20:00Z', NOW)).toBe('40분 전');
  });

  it('시계가 어긋나 미래 시각이 와도 "방금" 으로 둔다', () => {
    expect(formatRequestedAt('2026-07-27T12:03:00+09:00', NOW)).toBe('방금');
  });

  it('날짜로 읽을 수 없으면 빈 문자열이다', () => {
    expect(formatRequestedAt('어제', NOW)).toBe('');
  });
});
