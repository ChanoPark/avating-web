import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type DashboardScenario = 'success' | 'partial-fail' | 'empty' | 'server-error';

export const mockDashboardStats = {
  data: {
    totalDispatched: 47,
    totalDispatchedDelta: 8,
    avgAffinity: 64,
    avgAffinityDelta: 3.2,
    matches: 3,
    matchRate: 6.4,
    interventionsThisWeek: 21,
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

export const postSessionHandler = (scenario: DashboardScenario = 'success') => {
  if (scenario === 'server-error') {
    return http.post(`${BASE_URL}/api/sessions`, () => {
      return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
    });
  }
  return http.post(`${BASE_URL}/api/sessions`, () => {
    return HttpResponse.json(mockCreateSessionResponse, { status: 201 });
  });
};

export const dashboardHandlers = [getDashboardStatsHandler(), postSessionHandler()];

export const statsHandlers = {
  success: getDashboardStatsHandler('success'),
  partialFail: getDashboardStatsHandler('partial-fail'),
  serverError: getDashboardStatsHandler('server-error'),
};

export const sessionHandlers = {
  success: postSessionHandler('success'),
  serverError: postSessionHandler('server-error'),
};
