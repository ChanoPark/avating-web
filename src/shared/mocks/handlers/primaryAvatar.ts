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
    tags: ['독서', '카페투어'],
  },
};

export const primaryAvatarHandlers = {
  success: http.get(`${BASE_URL}/api/avatars/primary`, () => {
    return HttpResponse.json(mockPrimaryAvatar);
  }),

  // 404 지만 정상 응답이다 — 아직 아바타를 만들지 않은 회원의 상태를 나타낸다.
  none: http.get(`${BASE_URL}/api/avatars/primary`, () => {
    return HttpResponse.json(
      { code: 'AVATAR_404_002', message: '아바타를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }),

  // 'none' 과 구분한다 — 이건 판정 불가(서버 오류)고, none 은 확정된 '대표 아바타 없음'이다.
  serverError: http.get(`${BASE_URL}/api/avatars/primary`, () => {
    return HttpResponse.json(
      { code: 'COMMON_500_001', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }),
};

export const primaryAvatarDefaultHandlers = [primaryAvatarHandlers.success];
