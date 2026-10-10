import { describe, it, expect } from 'vitest';
import { formatTurnTime } from '../lib/formatTurnTime';

describe('formatTurnTime', () => {
  it('보는 사람의 현지 시각을 24시간제 HH:mm 으로 쓴다', () => {
    expect(formatTurnTime(new Date(2026, 9, 9, 14, 5).toISOString())).toBe('14:05');
  });

  it('오전은 앞자리를 0 으로 채우고 자정은 00 시다', () => {
    expect(formatTurnTime(new Date(2026, 9, 9, 9, 30).toISOString())).toBe('09:30');
    expect(formatTurnTime(new Date(2026, 9, 9, 0, 0).toISOString())).toBe('00:00');
  });
});
