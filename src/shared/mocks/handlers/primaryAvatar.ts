import { http, HttpResponse } from 'msw';
import type { AvatarSummary } from '@entities/avatar';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const mockPrimaryAvatar: { data: AvatarSummary } = {
  data: {
    schemaVersion: 1,
    avatarId: '11111111-1111-4111-8111-111111111111',
    name: '루시',
    description: '따뜻하고 유머 감각 넘치는 ENFP',
    stats: {
      OPENNESS: 72.5,
      IMAGINATION: 68,
      EXTROVERSION: 80,
      EMPATHY: 65,
      PLANNING_LEVEL: 45,
      HUMOROUS: 88,
      AFFECTION_EXPRESSION: 55,
    },
  },
};

export const primaryAvatarHandlers = {
  /** 대표 아바타 보유 — 온보딩을 마친 회원. */
  success: http.get(`${BASE_URL}/api/avatars/primary`, () => {
    return HttpResponse.json(mockPrimaryAvatar);
  }),

  /** 대표 아바타 없음 — 아직 아바타를 만들지 않은 회원. 오류가 아니라 정상 응답이다. */
  none: http.get(`${BASE_URL}/api/avatars/primary`, () => {
    return HttpResponse.json(
      { code: 'AVATAR_404_002', message: '아바타를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }),

  /** 판정 불가 — 서버 오류. "대표 아바타 없음" 과 구분해야 한다. */
  serverError: http.get(`${BASE_URL}/api/avatars/primary`, () => {
    return HttpResponse.json(
      { code: 'COMMON_500_001', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }),
};

export const primaryAvatarDefaultHandlers = [primaryAvatarHandlers.success];
