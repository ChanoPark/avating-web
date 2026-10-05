import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { MatchRequest } from '@entities/match-request';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const matchRequestBodySchema = z.object({
  partnerAvatarId: z.string().min(1),
  requesterAvatarId: z.string().min(1),
  greeting: z.string().optional(),
});

export type MatchRequestScenario =
  | 'success'
  | 'partner-blocked'
  | 'duplicate-request'
  | 'avatar-not-found'
  | 'request-expired'
  | 'server-error';

let scenario: MatchRequestScenario = 'success';

export function setMatchRequestScenario(next: MatchRequestScenario): void {
  scenario = next;
}

export function resetMatchRequestScenario(): void {
  scenario = 'success';
}

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

export const matchRequestHandlers = [
  http.post(`${BASE_URL}/api/match-requests`, async ({ request }) => {
    const raw: unknown = await request.json();
    const body = matchRequestBodySchema.parse(raw);

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
      requesterAvatarId: body.requesterAvatarId,
      partnerAvatarId: body.partnerAvatarId,
      greeting: body.greeting ?? null,
    };
    return HttpResponse.json({ data: accepted });
  }),
];
