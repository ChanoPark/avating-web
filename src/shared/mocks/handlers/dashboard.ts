import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type DashboardScenario =
  | 'success'
  | 'partial-fail'
  | 'empty'
  | 'insufficient-gems'
  | 'server-error';

export const mockDashboardStats = {
  data: {
    totalDispatched: 47,
    totalDispatchedDelta: 8,
    avgAffinity: 64,
    avgAffinityDelta: 3.2,
    matches: 3,
    matchRate: 6.4,
    interventionsThisWeek: 21,
    gemsUsed: 153,
    gemsBalance: 1240,
  },
};

// avgAffinity: 101 — schema max(100) 의도적 위반, Zod parse 실패 시나리오용
export const mockDashboardStatsPartialFail = {
  data: {
    totalDispatched: 47,
    totalDispatchedDelta: 8,
    avgAffinity: 101,
    avgAffinityDelta: 3.2,
    matches: 3,
    matchRate: 6.4,
    interventionsThisWeek: 21,
    gemsUsed: 153,
    gemsBalance: 1240,
  },
};

export const mockRecommendedAvatars = {
  data: {
    items: [
      {
        id: 'avatar-1',
        initials: 'HW',
        name: 'Moonlit',
        handle: '@moonlit',
        level: 3,
        status: 'online',
        verified: true,
        type: '내향 · 낭만형',
        tags: ['서촌', '카페투어'],
        matchRate: 87,
      },
      {
        id: 'avatar-2',
        initials: 'SY',
        name: 'Spring',
        handle: '@spring',
        level: 2,
        status: 'busy',
        verified: false,
        type: '외향 · 활동형',
        tags: ['런닝', '클라이밍'],
        matchRate: 75,
      },
    ],
    nextCursor: null,
  },
};

export const mockRecommendedAvatarsEmpty = {
  data: {
    items: [],
    nextCursor: null,
  },
};

export const mockCreateSessionResponse = {
  data: {
    sessionId: 'session-123',
    avatarId: 'avatar-1',
    startedAt: '2026-04-27T00:00:00.000Z',
  },
};

export const getDashboardStatsHandler = (scenario: DashboardScenario = 'success') => {
  if (scenario === 'partial-fail') {
    return http.get(`${BASE_URL}/api/dashboard/stats`, () => {
      return HttpResponse.json(mockDashboardStatsPartialFail);
    });
  }
  if (scenario === 'server-error') {
    return http.get(`${BASE_URL}/api/dashboard/stats`, () => {
      return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
    });
  }
  return http.get(`${BASE_URL}/api/dashboard/stats`, () => {
    return HttpResponse.json(mockDashboardStats);
  });
};

export const getRecommendedAvatarsHandler = (scenario: DashboardScenario = 'success') => {
  if (scenario === 'empty') {
    return http.get(`${BASE_URL}/api/avatars/recommended`, () => {
      return HttpResponse.json(mockRecommendedAvatarsEmpty);
    });
  }
  if (scenario === 'server-error') {
    return http.get(`${BASE_URL}/api/avatars/recommended`, () => {
      return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
    });
  }
  return http.get(`${BASE_URL}/api/avatars/recommended`, () => {
    return HttpResponse.json(mockRecommendedAvatars);
  });
};

export const postSessionHandler = (scenario: DashboardScenario = 'success') => {
  if (scenario === 'insufficient-gems') {
    return http.post(`${BASE_URL}/api/sessions`, () => {
      return HttpResponse.json(
        { message: '다이아가 부족해요. 충전 페이지로 이동해주세요.', code: 'INSUFFICIENT_GEMS' },
        { status: 402 }
      );
    });
  }
  if (scenario === 'server-error') {
    return http.post(`${BASE_URL}/api/sessions`, () => {
      return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
    });
  }
  return http.post(`${BASE_URL}/api/sessions`, () => {
    return HttpResponse.json(mockCreateSessionResponse, { status: 201 });
  });
};

export const dashboardHandlers = [
  getDashboardStatsHandler(),
  getRecommendedAvatarsHandler(),
  postSessionHandler(),
];

export const statsHandlers = {
  success: getDashboardStatsHandler('success'),
  partialFail: getDashboardStatsHandler('partial-fail'),
  serverError: getDashboardStatsHandler('server-error'),
};

export const recommendedHandlers = {
  success: getRecommendedAvatarsHandler('success'),
  empty: getRecommendedAvatarsHandler('empty'),
  serverError: getRecommendedAvatarsHandler('server-error'),
};

export const sessionHandlers = {
  success: postSessionHandler('success'),
  insufficientGems: postSessionHandler('insufficient-gems'),
  serverError: postSessionHandler('server-error'),
};
