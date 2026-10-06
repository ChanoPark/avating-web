import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { CreatedInvitation } from '@entities/match-request';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const createInvitationBodySchema = z.object({
  inviterAvatarId: z.string().min(1),
  inviteeAvatarId: z.string().min(1),
  requestMessage: z.string().max(300),
});

export type MatchRequestScenario =
  | 'success'
  | 'in-progress'
  | 'avatar-not-found'
  | 'own-avatar'
  | 'same-avatar'
  | 'not-avatar-owner'
  | 'server-error';

let scenario: MatchRequestScenario = 'success';

export function setMatchRequestScenario(next: MatchRequestScenario): void {
  scenario = next;
}

export function resetMatchRequestScenario(): void {
  scenario = 'success';
}

export const mockCreatedInvitation: { data: CreatedInvitation } = {
  data: {
    simulationInvitationId: 'bbbbbbbb-0001-4000-8000-000000000001',
    inviterAvatarName: 'hyunwoo',
    inviterAvatarHashtag: 'HW4K7Z',
    inviteeAvatarName: '하늘',
    inviteeAvatarHashtag: 'H7K2MP',
    status: 'PENDING',
    expiredAt: '2026-07-28T12:00:00+09:00',
  },
};

const ERROR_RESPONSES: Record<
  Exclude<MatchRequestScenario, 'success'>,
  { status: number; code: string; message: string }
> = {
  'in-progress': {
    status: 400,
    code: 'SIMULATION_400_002',
    message: 'hyunwoo은(는) 이미 진행 중인 시뮬레이션이 있습니다.',
  },
  'avatar-not-found': {
    status: 400,
    code: 'SIMULATION_400_001',
    message: '아바타를 찾을 수 없습니다.',
  },
  'own-avatar': {
    status: 400,
    code: 'SIMULATION_400_005',
    message: '자신의 아바타는 초대할 수 없습니다.',
  },
  'same-avatar': {
    status: 400,
    code: 'SIMULATION_400_006',
    message: '동일한 아바타를 초대할 수 없습니다.',
  },
  'not-avatar-owner': {
    status: 403,
    code: 'SIMULATION_403_001',
    message: '해당 아바타로 시뮬레이션을 진행할 권한이 없습니다.',
  },
  'server-error': { status: 500, code: 'COMMON_500_001', message: '서버 오류가 발생했습니다' },
};

export const matchRequestHandlers = [
  http.post(`${BASE_URL}/api/simulations/invitations`, async ({ request }) => {
    const raw: unknown = await request.json();
    const body = createInvitationBodySchema.safeParse(raw);
    if (!body.success) {
      return HttpResponse.json(
        { code: 'COMMON_400_001', message: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    if (scenario !== 'success') {
      const { status, code, message } = ERROR_RESPONSES[scenario];
      return HttpResponse.json({ code, message }, { status });
    }

    return HttpResponse.json(mockCreatedInvitation, { status: 201 });
  }),
];
