import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { InvitationHistoryItem, InvitationHistoryPage } from '@entities/match-request';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const HISTORY_URL = `${BASE_URL}/api/simulations/invitations`;
const ACCEPT_URL = `${HISTORY_URL}/:invitationId/accept`;
const CANCEL_URL = `${HISTORY_URL}/:invitationId/cancel`;
const REJECT_URL = `${HISTORY_URL}/:invitationId/reject`;

const DEFAULT_PAGE_SIZE = 10;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const KST_OFFSET = 9 * HOUR;

function kstIso(epochMs: number): string {
  return new Date(epochMs + KST_OFFSET).toISOString().replace('Z', '+09:00');
}

const MY_HYUNWOO = {
  id: 'aaaaaaaa-0001-4000-8000-000000000001',
  name: 'hyunwoo',
  tag: 'HW4K7Z',
  color: '67C4F2',
};
const MY_HYUN_NIGHT = {
  id: 'aaaaaaaa-0002-4000-8000-000000000002',
  name: 'hyun_night',
  tag: 'HN8R2Q',
  color: 'E887B6',
};
const MY_SUMMER = {
  id: 'aaaaaaaa-0004-4000-8000-000000000004',
  name: '여름',
  tag: 'YR5T8K',
  color: 'DC7100',
};
const HANEUL = {
  id: '22222222-2222-4222-8222-222222222222',
  name: '하늘',
  tag: 'H7K2MP',
  color: '67C4F2',
};
const BOMNAL = {
  id: '33333333-3333-4333-8333-333333333333',
  name: '봄날',
  tag: 'B3RT9Q',
  color: '2451A9',
};
const MOONLIT = {
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Moonlit',
  tag: 'Q5WN8Z',
  color: '9F50B7',
};

type MockAvatar = typeof HANEUL;

function invitation(
  id: string,
  inviter: MockAvatar,
  invitee: MockAvatar,
  {
    elapsed,
    ...rest
  }: Pick<InvitationHistoryItem, 'status' | 'direction' | 'simulationId' | 'requestMessage'> & {
    elapsed: number;
  }
): InvitationHistoryItem {
  const createdAt = Date.now() - elapsed;
  return {
    simulationInvitationId: id,
    inviterAvatarId: inviter.id,
    inviterAvatarName: inviter.name,
    inviterAvatarHashtag: inviter.tag,
    inviterAvatarColor: inviter.color,
    inviteeAvatarId: invitee.id,
    inviteeAvatarName: invitee.name,
    inviteeAvatarHashtag: invitee.tag,
    inviteeAvatarColor: invitee.color,
    createdAt: kstIso(createdAt),
    expiredAt: kstIso(createdAt + DAY),
    ...rest,
  };
}

export const mockInvitationHistory: InvitationHistoryItem[] = [
  invitation('cccccccc-0007-4000-8000-000000000007', MOONLIT, MY_SUMMER, {
    status: 'PENDING',
    direction: 'RECEIVED',
    requestMessage: '주말에 전시 보러 가는 얘기 해 봐요',
    elapsed: 10 * MINUTE,
  }),
  invitation('cccccccc-0001-4000-8000-000000000001', MY_HYUN_NIGHT, HANEUL, {
    status: 'IN_PROGRESS',
    direction: 'SENT',
    simulationId: 'dddddddd-0001-4000-8000-000000000001',
    elapsed: 40 * MINUTE,
  }),
  invitation('cccccccc-0002-4000-8000-000000000002', MY_HYUNWOO, BOMNAL, {
    status: 'PENDING',
    direction: 'SENT',
    elapsed: 3 * HOUR + 12 * MINUTE,
  }),
  invitation('cccccccc-0003-4000-8000-000000000003', MY_HYUNWOO, MOONLIT, {
    status: 'DONE',
    direction: 'SENT',
    simulationId: 'dddddddd-0003-4000-8000-000000000003',
    elapsed: 2 * DAY + 5 * HOUR + 30 * MINUTE,
  }),
  invitation('cccccccc-0008-4000-8000-000000000008', MY_HYUNWOO, HANEUL, {
    status: 'CANCELED',
    direction: 'SENT',
    elapsed: 3 * DAY,
  }),
  invitation('cccccccc-0004-4000-8000-000000000004', HANEUL, MY_HYUNWOO, {
    status: 'DONE',
    direction: 'RECEIVED',
    simulationId: 'dddddddd-0004-4000-8000-000000000004',
    elapsed: 5 * DAY,
  }),
  invitation('cccccccc-0005-4000-8000-000000000005', BOMNAL, MY_SUMMER, {
    status: 'REJECTED',
    direction: 'RECEIVED',
    elapsed: 6 * DAY,
  }),
  invitation('cccccccc-0006-4000-8000-000000000006', MOONLIT, MY_SUMMER, {
    status: 'ABORTED',
    direction: 'RECEIVED',
    simulationId: 'dddddddd-0006-4000-8000-000000000006',
    elapsed: 9 * DAY,
  }),
];

const SUNNY = {
  id: '55555555-5555-4555-8555-555555555555',
  name: '햇살',
  tag: 'S2NY7K',
  color: 'F2C94C',
};
const WAVE = {
  id: '66666666-6666-4666-8666-666666666666',
  name: '파도',
  tag: 'W4VE3P',
  color: '2D9CDB',
};

function expiredReceived(
  id: string,
  inviter: MockAvatar,
  invitee: MockAvatar
): InvitationHistoryItem {
  const createdAt = Date.now() - DAY - HOUR;
  return {
    ...invitation(id, inviter, invitee, { status: 'PENDING', direction: 'RECEIVED', elapsed: 0 }),
    createdAt: kstIso(createdAt),
    expiredAt: kstIso(createdAt + DAY),
  };
}

export const mockManyReceivedInvitations: InvitationHistoryItem[] = [
  invitation('cccccccc-0101-4000-8000-000000000101', SUNNY, MY_HYUNWOO, {
    status: 'PENDING',
    direction: 'RECEIVED',
    requestMessage: '요즘 빠진 취미 얘기부터 해 봐요',
    elapsed: 2 * MINUTE,
  }),
  invitation('cccccccc-0102-4000-8000-000000000102', WAVE, MY_HYUN_NIGHT, {
    status: 'PENDING',
    direction: 'RECEIVED',
    elapsed: 45 * MINUTE,
  }),
  invitation('cccccccc-0103-4000-8000-000000000103', HANEUL, MY_SUMMER, {
    status: 'PENDING',
    direction: 'RECEIVED',
    requestMessage: '여행 좋아하시면 꼭 얘기 나눠 보고 싶어요. 바다 쪽이면 더 좋고요!',
    elapsed: 5 * HOUR,
  }),
  expiredReceived('cccccccc-0104-4000-8000-000000000104', BOMNAL, MY_HYUNWOO),
  ...mockInvitationHistory,
];

export const mockNoReceivedPendingInvitations: InvitationHistoryItem[] =
  mockInvitationHistory.filter(
    (item) => !(item.direction === 'RECEIVED' && item.status === 'PENDING')
  );

function historyResponse(request: Request, items: InvitationHistoryItem[]) {
  const params = new URL(request.url).searchParams;
  const direction = params.get('direction');
  if (direction !== 'SENT' && direction !== 'RECEIVED') {
    return HttpResponse.json(
      { code: 'COMMON_400_001', message: '입력값이 올바르지 않습니다.' },
      { status: 400 }
    );
  }

  const status = params.get('status');
  const size = Number(params.get('size') ?? DEFAULT_PAGE_SIZE);
  const matched = items.filter(
    (item) => item.direction === direction && (status === null || item.status === status)
  );
  const page: InvitationHistoryPage = {
    content: matched.slice(0, size),
    hasNext: matched.length > size,
  };
  return HttpResponse.json({ data: page });
}

export function invitationHistoryHandler(items: InvitationHistoryItem[]) {
  return http.get(HISTORY_URL, ({ request }) => historyResponse(request, items));
}

let invitations = mockInvitationHistory;

export function resetInvitationHistory(): void {
  invitations = mockInvitationHistory;
}

export function seedInvitationHistory(items: InvitationHistoryItem[]): void {
  invitations = items;
}

function transition(invitationId: unknown, status: InvitationHistoryItem['status']): void {
  invitations = invitations.map((item) =>
    item.simulationInvitationId === invitationId ? { ...item, status } : item
  );
}

const NOT_PENDING_ERROR = {
  code: 'SIMULATION_400_004',
  message: 'CANCELED 시뮬레이션은 수락할 수 없습니다.',
};
const SERVER_ERROR = { code: 'COMMON_500_001', message: '서버 오류가 발생했습니다' };
const VALIDATION_ERROR = { code: 'COMMON_400_001', message: '입력값이 올바르지 않습니다.' };
const rejectBodySchema = z.object({ rejectMessage: z.string().trim().min(1).max(300) });

export const invitationHistoryHandlers = {
  success: http.get(HISTORY_URL, ({ request }) => historyResponse(request, invitations)),

  empty: invitationHistoryHandler([]),

  serverError: http.get(HISTORY_URL, () => HttpResponse.json(SERVER_ERROR, { status: 500 })),
};

export const invitationAcceptHandlers = {
  success: http.post(ACCEPT_URL, ({ params }) => {
    transition(params.invitationId, 'ACCEPTED');
    return HttpResponse.json({ data: {} }, { status: 201 });
  }),

  notPending: http.post(ACCEPT_URL, () => HttpResponse.json(NOT_PENDING_ERROR, { status: 400 })),

  serverError: http.post(ACCEPT_URL, () => HttpResponse.json(SERVER_ERROR, { status: 500 })),
};

export const invitationCancelHandlers = {
  success: http.patch(CANCEL_URL, ({ params }) => {
    transition(params.invitationId, 'CANCELED');
    return HttpResponse.json({ data: {} });
  }),

  serverError: http.patch(CANCEL_URL, () => HttpResponse.json(SERVER_ERROR, { status: 500 })),
};

export const invitationRejectHandlers = {
  success: http.patch(REJECT_URL, async ({ params, request }) => {
    if (!rejectBodySchema.safeParse(await request.json()).success) {
      return HttpResponse.json(VALIDATION_ERROR, { status: 400 });
    }
    transition(params.invitationId, 'REJECTED');
    return HttpResponse.json({ data: {} });
  }),

  notPending: http.patch(REJECT_URL, () => HttpResponse.json(NOT_PENDING_ERROR, { status: 400 })),

  serverError: http.patch(REJECT_URL, () => HttpResponse.json(SERVER_ERROR, { status: 500 })),
};

export const invitationHistoryDefaultHandlers = [
  invitationHistoryHandlers.success,
  invitationAcceptHandlers.success,
  invitationCancelHandlers.success,
  invitationRejectHandlers.success,
];
