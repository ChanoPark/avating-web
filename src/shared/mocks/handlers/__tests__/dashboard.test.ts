import { describe, it, expect } from 'vitest';
import {
  mockDashboardStats,
  mockDashboardStatsPartialFail,
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
