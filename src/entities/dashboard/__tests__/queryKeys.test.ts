import { describe, it, expect } from 'vitest';
import { dashboardKeys } from '../queryKeys';
import type { RecommendedAvatarFilter } from '../model';

const defaultFilter: RecommendedAvatarFilter = {
  online: false,
  introvert: false,
  extrovert: false,
  verified: false,
};

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

  describe('recommended(filter)', () => {
    it('dashboard, recommended, filter 객체를 포함한다', () => {
      const key = dashboardKeys.recommended(defaultFilter);
      expect(key[0]).toBe('dashboard');
      expect(key[1]).toBe('recommended');
      expect(key[2]).toEqual(defaultFilter);
    });

    it('동일 필터 객체로 두 번 호출 시 deep equal 이다', () => {
      const filterA: RecommendedAvatarFilter = {
        online: true,
        introvert: false,
        extrovert: false,
        verified: false,
      };
      const filterB: RecommendedAvatarFilter = {
        online: true,
        introvert: false,
        extrovert: false,
        verified: false,
      };
      expect(dashboardKeys.recommended(filterA)).toEqual(dashboardKeys.recommended(filterB));
    });

    it('다른 필터는 다른 키를 반환한다', () => {
      const filterOnline: RecommendedAvatarFilter = {
        online: true,
        introvert: false,
        extrovert: false,
        verified: false,
      };
      const filterVerified: RecommendedAvatarFilter = {
        online: false,
        introvert: false,
        extrovert: false,
        verified: true,
      };
      expect(dashboardKeys.recommended(filterOnline)).not.toEqual(
        dashboardKeys.recommended(filterVerified)
      );
    });

    it('all prefix 를 포함한다', () => {
      const key = dashboardKeys.recommended(defaultFilter);
      expect(key[0]).toBe(dashboardKeys.all[0]);
    });

    it('TanStack Query 캐싱 호환 — JSON.stringify 동일 필터는 동일 결과', () => {
      const filter: RecommendedAvatarFilter = {
        online: true,
        introvert: true,
        extrovert: false,
        verified: false,
      };
      const key1 = dashboardKeys.recommended(filter);
      const key2 = dashboardKeys.recommended({ ...filter });
      expect(JSON.stringify(key1)).toBe(JSON.stringify(key2));
    });
  });
});
