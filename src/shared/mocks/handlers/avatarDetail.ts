import { http, HttpResponse } from 'msw';
import type { AvatarDetail } from '@entities/avatar';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type AvatarDetailScenario =
  | 'success'
  | 'busy'
  | 'not-found'
  | 'bad-request'
  | 'server-error';

let scenario: AvatarDetailScenario = 'success';
let lastRequestedAvatarId: string | undefined;

export function setAvatarDetailScenario(next: AvatarDetailScenario): void {
  scenario = next;
}

export function resetAvatarDetailScenario(): void {
  scenario = 'success';
  lastRequestedAvatarId = undefined;
}

export function getLastRequestedAvatarId(): string | undefined {
  return lastRequestedAvatarId;
}

// 서버 AvatarDetailResponse 형상 (avating-core db29da9).
const baseAvatar: AvatarDetail = {
  avatarId: 'avatar-1',
  name: 'Moonlit Narrator',
  hashtag: 'M00N7K',
  description: '심야의 책방을 좋아하는 낭만가. 천천히 듣고, 문장으로 마음을 건넵니다.',
  color: '67C4F2',
  stats: {
    OPENNESS: 72.5,
    IMAGINATION: 68,
    EXTROVERSION: 52,
    EMPATHY: 81,
    PLANNING_LEVEL: 45,
    HUMOROUS: 69,
    AFFECTION_EXPRESSION: 60,
  },
  tags: ['독립서점', '심야 카페', '영화'],
  canRequestSimulation: true,
};

// `/api/avatars/:id` 는 /primary·/candidates 도 삼키므로 server.ts·browser.ts 에서 아바타 핸들러 중 맨 뒤에 둔다.
export const avatarDetailHandlers = [
  http.get(`${BASE_URL}/api/avatars/:id`, ({ params }) => {
    const id = String(params.id);
    lastRequestedAvatarId = id;
    if (scenario === 'server-error') {
      return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
    }
    if (scenario === 'bad-request') {
      return HttpResponse.json(
        { code: 'COMMON_400_001', message: '잘못된 요청입니다' },
        { status: 400 }
      );
    }
    if (scenario === 'not-found') {
      return HttpResponse.json(
        { code: 'AVATAR_404_002', message: '아바타를 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      data: {
        ...baseAvatar,
        avatarId: id,
        canRequestSimulation: scenario !== 'busy',
      } satisfies AvatarDetail,
    });
  }),
];
