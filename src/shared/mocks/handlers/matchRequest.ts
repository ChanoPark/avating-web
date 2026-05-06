import { http, HttpResponse } from 'msw';
import type { MatchRequest, MyAvatar } from '@entities/match-request';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type MatchRequestScenario =
  | 'success'
  | 'insufficient-gems'
  | 'partner-blocked'
  | 'duplicate-request'
  | 'avatar-not-found'
  | 'request-expired'
  | 'server-error';

export type MyAvatarsScenario = 'success' | 'no-avatars' | 'all-busy' | 'load-error';

let scenario: MatchRequestScenario = 'success';
let avatarsScenario: MyAvatarsScenario = 'success';

export function setMatchRequestScenario(next: MatchRequestScenario): void {
  scenario = next;
}

export function resetMatchRequestScenario(): void {
  scenario = 'success';
  avatarsScenario = 'success';
}

export function setMyAvatarsScenario(next: MyAvatarsScenario): void {
  avatarsScenario = next;
}

export const mockMyAvatars: { data: { items: MyAvatar[] } } = {
  data: {
    items: [
      {
        id: 'me-hyunwoo',
        initials: 'HW',
        name: 'hyunwoo',
        handle: '@hyunwoo',
        level: 3,
        status: 'online',
        verified: true,
        type: '내향·분석형',
        isPrimary: true,
        busy: false,
      },
      {
        id: 'me-hyun-night',
        initials: 'HN',
        name: 'hyun_night',
        handle: '@hyun_night',
        level: 2,
        status: 'busy',
        verified: false,
        type: '내향·낭만형',
        isPrimary: false,
        busy: true,
      },
      {
        id: 'me-hyunsoft',
        initials: 'HS',
        name: 'hyunsoft',
        handle: '@hyunsoft',
        level: 1,
        status: 'online',
        verified: false,
        type: '외향·공감형',
        isPrimary: false,
        busy: false,
      },
    ],
  },
};

const mockSentRequest: MatchRequest = {
  id: 'req-001',
  requesterUserId: 'me',
  requesterAvatarId: 'me-hyunwoo',
  partnerUserId: 'partner',
  partnerAvatarId: 'avatar-1',
  greeting: '안녕하세요, 서촌 카페 좋아하신다고 들었어요.',
  status: 'pending',
  rejectionReason: null,
  createdAt: '2026-05-06T05:00:00.000Z',
  respondedAt: null,
  expiresAt: '2026-05-07T05:00:00.000Z',
};

const allBusyAvatars: MyAvatar[] = mockMyAvatars.data.items.map((avatar) => ({
  ...avatar,
  status: 'busy',
  busy: true,
}));

export const matchRequestHandlers = [
  http.get(`${BASE_URL}/api/me/avatars`, () => {
    if (avatarsScenario === 'load-error') {
      return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
    }
    if (avatarsScenario === 'no-avatars') {
      return HttpResponse.json({ data: { items: [] } });
    }
    if (avatarsScenario === 'all-busy') {
      return HttpResponse.json({ data: { items: allBusyAvatars } });
    }
    return HttpResponse.json(mockMyAvatars);
  }),
  http.post(`${BASE_URL}/api/match-requests`, async ({ request }) => {
    const body = (await request.json()) as {
      partnerAvatarId?: string;
      requesterAvatarId?: string;
      greeting?: string;
    };

    if (scenario === 'insufficient-gems') {
      return HttpResponse.json(
        { message: '다이아가 부족해요', code: 'INSUFFICIENT_GEMS' },
        { status: 402 }
      );
    }
    if (scenario === 'partner-blocked') {
      return HttpResponse.json(
        { message: '이 사용자에게는 요청을 보낼 수 없어요', code: 'PARTNER_BLOCKED' },
        { status: 409 }
      );
    }
    if (scenario === 'duplicate-request') {
      return HttpResponse.json(
        { message: '이미 응답 대기 중인 요청이 있어요', code: 'DUPLICATE_REQUEST' },
        { status: 409 }
      );
    }
    if (scenario === 'avatar-not-found') {
      return HttpResponse.json(
        { message: '아바타를 찾을 수 없어요', code: 'AVATAR_NOT_FOUND' },
        { status: 404 }
      );
    }
    if (scenario === 'request-expired') {
      return HttpResponse.json(
        { message: '요청이 만료됐어요', code: 'REQUEST_EXPIRED' },
        { status: 410 }
      );
    }
    if (scenario === 'server-error') {
      return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
    }

    const accepted: MatchRequest = {
      ...mockSentRequest,
      requesterAvatarId: body.requesterAvatarId ?? mockSentRequest.requesterAvatarId,
      partnerAvatarId: body.partnerAvatarId ?? mockSentRequest.partnerAvatarId,
      greeting: body.greeting ?? null,
    };
    return HttpResponse.json({ data: accepted });
  }),
];
