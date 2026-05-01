import { describe, it, expect } from 'vitest';
import {
  dashboardStatsSchema,
  recommendedAvatarSchema,
  recommendedAvatarFilterSchema,
  recommendedAvatarsResponseSchema,
  createSessionRequestSchema,
  createSessionResponseSchema,
  apiResponseDashboardStats,
  apiResponseRecommendedAvatars,
  apiResponseCreateSession,
} from '../model';

const validDashboardStats = {
  totalDispatched: 47,
  totalDispatchedDelta: 8,
  avgAffinity: 64,
  avgAffinityDelta: 3.2,
  matches: 3,
  matchRate: 6.4,
  interventionsThisWeek: 21,
  gemsUsed: 153,
  gemsBalance: 1240,
};

const validRecommendedAvatar = {
  id: 'avatar-1',
  initials: 'HW',
  name: 'Moonlit',
  handle: '@moonlit',
  level: 3,
  status: 'online' as const,
  verified: true,
  type: '내향 · 낭만형',
  tags: ['서촌', '카페투어'],
  matchRate: 87,
};

describe('dashboardStatsSchema', () => {
  it('정상 응답을 파싱한다', () => {
    const result = dashboardStatsSchema.parse(validDashboardStats);
    expect(result.totalDispatched).toBe(47);
    expect(result.avgAffinity).toBe(64);
    expect(result.gemsBalance).toBe(1240);
  });

  it('totalDispatched 음수는 실패한다 (nonnegative)', () => {
    expect(() =>
      dashboardStatsSchema.parse({ ...validDashboardStats, totalDispatched: -1 })
    ).toThrow();
  });

  it('matches 음수는 실패한다 (nonnegative)', () => {
    expect(() => dashboardStatsSchema.parse({ ...validDashboardStats, matches: -1 })).toThrow();
  });

  it('interventionsThisWeek 음수는 실패한다 (nonnegative)', () => {
    expect(() =>
      dashboardStatsSchema.parse({ ...validDashboardStats, interventionsThisWeek: -1 })
    ).toThrow();
  });

  it('gemsBalance 음수는 실패한다 (nonnegative)', () => {
    expect(() => dashboardStatsSchema.parse({ ...validDashboardStats, gemsBalance: -1 })).toThrow();
  });

  it('avgAffinity 101 은 실패한다 (max 100)', () => {
    expect(() =>
      dashboardStatsSchema.parse({ ...validDashboardStats, avgAffinity: 101 })
    ).toThrow();
  });

  it('avgAffinity 0 은 통과한다 (min 0)', () => {
    const result = dashboardStatsSchema.parse({ ...validDashboardStats, avgAffinity: 0 });
    expect(result.avgAffinity).toBe(0);
  });

  it('avgAffinity 100 은 통과한다 (max 100)', () => {
    const result = dashboardStatsSchema.parse({ ...validDashboardStats, avgAffinity: 100 });
    expect(result.avgAffinity).toBe(100);
  });

  it('avgAffinity -0.1 은 실패한다', () => {
    expect(() =>
      dashboardStatsSchema.parse({ ...validDashboardStats, avgAffinity: -0.1 })
    ).toThrow();
  });

  it('totalDispatched 소수는 실패한다 (int 강제)', () => {
    expect(() =>
      dashboardStatsSchema.parse({ ...validDashboardStats, totalDispatched: 1.5 })
    ).toThrow();
  });

  it('추가 필드는 무시된다', () => {
    const result = dashboardStatsSchema.parse({ ...validDashboardStats, extra: 'ignored' });
    expect(result).not.toHaveProperty('extra');
  });

  it('totalDispatched 필드 누락 시 실패한다', () => {
    const { totalDispatched: _omit, ...without } = validDashboardStats;
    expect(() => dashboardStatsSchema.parse(without)).toThrow();
  });
});

describe('recommendedAvatarSchema', () => {
  it('정상 객체를 파싱한다', () => {
    const result = recommendedAvatarSchema.parse(validRecommendedAvatar);
    expect(result.id).toBe('avatar-1');
    expect(result.type).toBe('내향 · 낭만형');
    expect(result.matchRate).toBe(87);
  });

  it('tags 9개는 실패한다 (max 8)', () => {
    expect(() =>
      recommendedAvatarSchema.parse({
        ...validRecommendedAvatar,
        tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
      })
    ).toThrow();
  });

  it('tags 8개는 통과한다', () => {
    const result = recommendedAvatarSchema.parse({
      ...validRecommendedAvatar,
      tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    });
    expect(result.tags).toHaveLength(8);
  });

  it('matchRate 100.1 은 실패한다', () => {
    expect(() =>
      recommendedAvatarSchema.parse({ ...validRecommendedAvatar, matchRate: 100.1 })
    ).toThrow();
  });

  it('matchRate 100 은 통과한다', () => {
    const result = recommendedAvatarSchema.parse({ ...validRecommendedAvatar, matchRate: 100 });
    expect(result.matchRate).toBe(100);
  });

  it('matchRate 0 은 통과한다', () => {
    const result = recommendedAvatarSchema.parse({ ...validRecommendedAvatar, matchRate: 0 });
    expect(result.matchRate).toBe(0);
  });

  it('type 빈 문자열은 실패한다', () => {
    expect(() => recommendedAvatarSchema.parse({ ...validRecommendedAvatar, type: '' })).toThrow();
  });
});

describe('recommendedAvatarFilterSchema', () => {
  it('4개 boolean 필드로 파싱된다', () => {
    const result = recommendedAvatarFilterSchema.parse({
      online: false,
      introvert: false,
      extrovert: false,
      verified: false,
    });
    expect(result.online).toBe(false);
    expect(result.introvert).toBe(false);
    expect(result.extrovert).toBe(false);
    expect(result.verified).toBe(false);
  });

  it('boolean 대신 문자열은 실패한다', () => {
    expect(() =>
      recommendedAvatarFilterSchema.parse({
        online: 'true',
        introvert: false,
        extrovert: false,
        verified: false,
      })
    ).toThrow();
  });

  it('필드 누락 시 실패한다', () => {
    expect(() =>
      recommendedAvatarFilterSchema.parse({
        online: false,
        introvert: false,
      })
    ).toThrow();
  });
});

describe('recommendedAvatarsResponseSchema', () => {
  it('items + nextCursor: null 로 파싱된다', () => {
    const result = recommendedAvatarsResponseSchema.parse({
      items: [validRecommendedAvatar],
      nextCursor: null,
    });
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
  });

  it('nextCursor 가 string 이면 통과한다', () => {
    const result = recommendedAvatarsResponseSchema.parse({
      items: [],
      nextCursor: 'cursor-abc',
    });
    expect(result.nextCursor).toBe('cursor-abc');
  });

  it('items 가 없으면 실패한다', () => {
    expect(() => recommendedAvatarsResponseSchema.parse({ nextCursor: null })).toThrow();
  });
});

describe('createSessionRequestSchema', () => {
  it('정상 avatarId 로 파싱된다', () => {
    const result = createSessionRequestSchema.parse({ avatarId: 'avatar-1' });
    expect(result.avatarId).toBe('avatar-1');
  });

  it('빈 avatarId 는 실패한다', () => {
    expect(() => createSessionRequestSchema.parse({ avatarId: '' })).toThrow();
  });

  it('avatarId 필드 누락 시 실패한다', () => {
    expect(() => createSessionRequestSchema.parse({})).toThrow();
  });
});

describe('createSessionResponseSchema', () => {
  it('정상 응답을 파싱한다', () => {
    const result = createSessionResponseSchema.parse({
      sessionId: 'session-123',
      avatarId: 'avatar-1',
      startedAt: '2026-04-27T00:00:00.000Z',
    });
    expect(result.sessionId).toBe('session-123');
  });

  it('sessionId 빈 문자열은 실패한다', () => {
    expect(() =>
      createSessionResponseSchema.parse({
        sessionId: '',
        avatarId: 'avatar-1',
        startedAt: '2026-04-27T00:00:00.000Z',
      })
    ).toThrow();
  });
});

describe('apiResponseDashboardStats envelope', () => {
  it('data 필드 포함 시 파싱된다', () => {
    const result = apiResponseDashboardStats.parse({ data: validDashboardStats });
    expect(result.data.totalDispatched).toBe(47);
  });

  it('data 필드 누락 시 throw 한다', () => {
    expect(() => apiResponseDashboardStats.parse({})).toThrow();
  });

  it('data 가 잘못된 형태이면 throw 한다', () => {
    expect(() => apiResponseDashboardStats.parse({ data: { totalDispatched: -1 } })).toThrow();
  });
});

describe('apiResponseRecommendedAvatars envelope', () => {
  it('data 필드 포함 시 파싱된다', () => {
    const result = apiResponseRecommendedAvatars.parse({
      data: { items: [validRecommendedAvatar], nextCursor: null },
    });
    expect(result.data.items).toHaveLength(1);
  });

  it('data 필드 누락 시 throw 한다', () => {
    expect(() => apiResponseRecommendedAvatars.parse({})).toThrow();
  });
});

describe('apiResponseCreateSession envelope', () => {
  it('data 필드 포함 시 파싱된다', () => {
    const result = apiResponseCreateSession.parse({
      data: {
        sessionId: 'session-123',
        avatarId: 'avatar-1',
        startedAt: '2026-04-27T00:00:00.000Z',
      },
    });
    expect(result.data.sessionId).toBe('session-123');
  });

  it('data 필드 누락 시 throw 한다', () => {
    expect(() => apiResponseCreateSession.parse({})).toThrow();
  });
});
