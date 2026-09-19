import { describe, it, expect } from 'vitest';
import { dashboardKeys } from '../queryKeys';

describe('dashboardKeys', () => {
  describe('all', () => {
    it('["dashboard"] 이다', () => {
      expect(dashboardKeys.all).toEqual(['dashboard']);
    });

    it('readonly tuple 이다', () => {
      expect(Array.isArray(dashboardKeys.all)).toBe(true);
      expect(dashboardKeys.all[0]).toBe('dashboard');
    });
  });

  describe('stats()', () => {
    it('["dashboard", "stats"] 이다', () => {
      expect(dashboardKeys.stats()).toEqual(['dashboard', 'stats']);
    });

    it('all 을 prefix 로 포함한다', () => {
      const key = dashboardKeys.stats();
      expect(key[0]).toBe('dashboard');
      expect(key[1]).toBe('stats');
    });

    it('매 호출마다 같은 값을 반환한다', () => {
      expect(dashboardKeys.stats()).toEqual(dashboardKeys.stats());
    });
  });
});
