import { http, HttpResponse } from 'msw';
import type { AvatarDetail } from '@entities/avatar';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type AvatarDetailScenario = 'success' | 'busy' | 'not-found' | 'server-error';

let scenario: AvatarDetailScenario = 'success';

export function setAvatarDetailScenario(next: AvatarDetailScenario): void {
  scenario = next;
}

export function resetAvatarDetailScenario(): void {
  scenario = 'success';
}

const baseAvatar: AvatarDetail = {
  id: 'avatar-1',
  initials: 'MN',
  name: 'Moonlit Narrator',
  handle: '@moonlit',
  level: 6,
  status: 'online',
  verified: true,
  type: '내향·낭만형',
  tags: ['독립서점', '심야 카페', '영화'],
  stats: {
    empathy: 81,
    proactivity: 52,
    humor: 69,
    sensitivity: 88,
    listening: 74,
    expressiveness: 60,
  },
  sessionHistory: [
    {
      id: 'session-1',
      turn: 12,
      totalTurns: 12,
      affinity: 91,
      result: 'matched',
      endedAt: '2026-04-21T13:21:00.000Z',
    },
    {
      id: 'session-2',
      turn: 8,
      totalTurns: 12,
      affinity: 62,
      result: 'ended',
      endedAt: '2026-04-18T14:02:00.000Z',
    },
  ],
};

export const avatarDetailHandlers = [
  http.get(`${BASE_URL}/api/avatars/:id`, ({ params }) => {
    if (scenario === 'server-error') {
      return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
    }
    if (scenario === 'not-found') {
      return HttpResponse.json(
        { message: '아바타를 찾을 수 없어요', code: 'AVATAR_NOT_FOUND' },
        { status: 404 }
      );
    }
    const id = String(params.id);
    return HttpResponse.json({
      data: {
        ...baseAvatar,
        id,
        status: scenario === 'busy' ? 'busy' : baseAvatar.status,
      } satisfies AvatarDetail,
    });
  }),
];
