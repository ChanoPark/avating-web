import { describe, it, expect } from 'vitest';
import {
  mockDashboardStats,
  mockDashboardStatsPartialFail,
  mockRecommendedAvatars,
  mockRecommendedAvatarsEmpty,
  mockCreateSessionResponse,
} from '../dashboard';

describe('dashboard MSW 핸들러 픽스처 정합성', () => {
  describe('mockDashboardStats', () => {
    it('data 필드가 존재한다', () => {
      expect(mockDashboardStats).toHaveProperty('data');
    });

    it('totalDispatched 는 nonnegative integer 이다', () => {
      expect(mockDashboardStats.data.totalDispatched).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(mockDashboardStats.data.totalDispatched)).toBe(true);
    });

    it('avgAffinity 는 0-100 범위이다', () => {
      expect(mockDashboardStats.data.avgAffinity).toBeGreaterThanOrEqual(0);
      expect(mockDashboardStats.data.avgAffinity).toBeLessThanOrEqual(100);
    });

    it('matches 는 nonnegative integer 이다', () => {
      expect(mockDashboardStats.data.matches).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(mockDashboardStats.data.matches)).toBe(true);
    });

    it('gemsBalance 는 nonnegative integer 이다', () => {
      expect(mockDashboardStats.data.gemsBalance).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(mockDashboardStats.data.gemsBalance)).toBe(true);
    });
  });

  describe('mockDashboardStatsPartialFail', () => {
    it('avgAffinity 가 100 초과 (Zod 검증 실패 유도용)', () => {
      expect(mockDashboardStatsPartialFail.data.avgAffinity).toBeGreaterThan(100);
    });

    it('다른 필드는 정상 범위이다', () => {
      expect(mockDashboardStatsPartialFail.data.totalDispatched).toBeGreaterThanOrEqual(0);
      expect(mockDashboardStatsPartialFail.data.matches).toBeGreaterThanOrEqual(0);
    });
  });

  describe('mockRecommendedAvatars', () => {
    it('items 배열이 존재한다', () => {
      expect(mockRecommendedAvatars.data.items).toBeInstanceOf(Array);
      expect(mockRecommendedAvatars.data.items.length).toBeGreaterThan(0);
    });

    it('첫 번째 아이템에 필수 필드가 있다', () => {
      const first = mockRecommendedAvatars.data.items[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('initials');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('handle');
      expect(first).toHaveProperty('level');
      expect(first).toHaveProperty('status');
      expect(first).toHaveProperty('verified');
      expect(first).toHaveProperty('type');
      expect(first).toHaveProperty('tags');
      expect(first).toHaveProperty('matchRate');
    });

    it('initials 는 1-2자이다', () => {
      for (const item of mockRecommendedAvatars.data.items) {
        expect(item.initials.length).toBeGreaterThanOrEqual(1);
        expect(item.initials.length).toBeLessThanOrEqual(2);
      }
    });

    it('status 는 online|busy|offline 중 하나이다', () => {
      const validStatuses = ['online', 'busy', 'offline'];
      for (const item of mockRecommendedAvatars.data.items) {
        expect(validStatuses).toContain(item.status);
      }
    });

    it('matchRate 는 0-100 범위이다', () => {
      for (const item of mockRecommendedAvatars.data.items) {
        expect(item.matchRate).toBeGreaterThanOrEqual(0);
        expect(item.matchRate).toBeLessThanOrEqual(100);
      }
    });

    it('tags 는 최대 8개이다', () => {
      for (const item of mockRecommendedAvatars.data.items) {
        expect(item.tags.length).toBeLessThanOrEqual(8);
      }
    });

    it('nextCursor 는 null 이다 (v1)', () => {
      expect(mockRecommendedAvatars.data.nextCursor).toBeNull();
    });
  });

  describe('mockRecommendedAvatarsEmpty', () => {
    it('items 가 빈 배열이다', () => {
      expect(mockRecommendedAvatarsEmpty.data.items).toHaveLength(0);
    });

    it('nextCursor 는 null 이다', () => {
      expect(mockRecommendedAvatarsEmpty.data.nextCursor).toBeNull();
    });
  });

  describe('mockCreateSessionResponse', () => {
    it('sessionId 가 non-empty string 이다', () => {
      expect(typeof mockCreateSessionResponse.data.sessionId).toBe('string');
      expect(mockCreateSessionResponse.data.sessionId.length).toBeGreaterThan(0);
    });

    it('avatarId 가 non-empty string 이다', () => {
      expect(typeof mockCreateSessionResponse.data.avatarId).toBe('string');
      expect(mockCreateSessionResponse.data.avatarId.length).toBeGreaterThan(0);
    });

    it('startedAt 이 ISO8601 형식이다', () => {
      const date = new Date(mockCreateSessionResponse.data.startedAt);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });
});
