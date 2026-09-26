import { http, HttpResponse } from 'msw';
import type { AvatarSimCandidateList } from '@entities/avatar';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// 요청 가능한 후보·진행 중 초대에 걸린 후보(canRequestSimulation=false)·소개가 빈 후보를 한 벌에 담는다.
// color 는 풀 안 색(하늘)·풀 밖 서버 기본색(봄날, 2451A9 → 회색)을 섞는다.
export const mockSimCandidates: { data: AvatarSimCandidateList } = {
  data: {
    items: [
      {
        avatarId: '22222222-2222-4222-8222-222222222222',
        name: '하늘',
        hashtag: 'H7K2MP',
        description: '느긋하게 산책하는 걸 좋아해요',
        stats: {
          OPENNESS: 60,
          IMAGINATION: 55.5,
          EXTROVERSION: 30,
          EMPATHY: 82,
          PLANNING_LEVEL: 70,
          HUMOROUS: 40,
          AFFECTION_EXPRESSION: 65,
        },
        tags: ['산책', '사진', '전시', '카페투어'],
        color: '67C4F2',
        canRequestSimulation: true,
      },
      {
        avatarId: '33333333-3333-4333-8333-333333333333',
        name: '봄날',
        hashtag: 'B3RT9Q',
        description: '주말마다 클라이밍하러 가요',
        stats: {
          OPENNESS: 78,
          IMAGINATION: 62,
          EXTROVERSION: 85,
          EMPATHY: 58,
          PLANNING_LEVEL: 40,
          HUMOROUS: 90,
          AFFECTION_EXPRESSION: 72,
        },
        tags: ['클라이밍'],
        color: '2451A9',
        canRequestSimulation: false,
      },
      {
        avatarId: '44444444-4444-4444-8444-444444444444',
        name: 'Moonlit',
        hashtag: 'Q5WN8Z',
        description: '',
        stats: {
          OPENNESS: 50,
          IMAGINATION: 50,
          EXTROVERSION: 50,
          EMPATHY: 50,
          PLANNING_LEVEL: 50,
          HUMOROUS: 50,
          AFFECTION_EXPRESSION: 50,
        },
        tags: [],
        color: '9F50B7',
        canRequestSimulation: true,
      },
    ],
    size: 3,
  },
};

export const simCandidatesHandlers = {
  success: http.get(`${BASE_URL}/api/avatars/candidates`, () => {
    return HttpResponse.json(mockSimCandidates);
  }),

  empty: http.get(`${BASE_URL}/api/avatars/candidates`, () => {
    return HttpResponse.json({ data: { items: [], size: 0 } });
  }),

  serverError: http.get(`${BASE_URL}/api/avatars/candidates`, () => {
    return HttpResponse.json(
      { code: 'COMMON_500_001', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }),
};

export const simCandidatesDefaultHandlers = [simCandidatesHandlers.success];
