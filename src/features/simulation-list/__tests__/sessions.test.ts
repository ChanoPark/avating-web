import { describe, it, expect } from 'vitest';
import type { InvitationHistoryItem } from '@entities/match-request';
import {
  RECENT_ENDED_LIMIT,
  findSimulationSession,
  toWatchSessions as toWatchSessionsAt,
  toSimulationSessions as toSessionsAt,
} from '../lib/sessions';

const NOW = Date.parse('2026-07-27T18:00:00+09:00');

function toSimulationSessions(invitations: InvitationHistoryItem[]) {
  return toSessionsAt(invitations, NOW);
}

function invitation(overrides: Partial<InvitationHistoryItem>): InvitationHistoryItem {
  return {
    simulationInvitationId: 'inv-1',
    inviterAvatarId: 'inviter',
    inviterAvatarName: '보낸이',
    inviteeAvatarId: 'invitee',
    inviteeAvatarName: '받은이',
    status: 'IN_PROGRESS',
    direction: 'SENT',
    expiredAt: '2026-07-28T12:00:00+09:00',
    createdAt: '2026-07-27T12:00:00+09:00',
    ...overrides,
  };
}

describe('toSimulationSessions', () => {
  it('보낸 초대는 초대한 아바타가 내 아바타, 초대받은 아바타가 상대다', () => {
    const { running } = toSimulationSessions([invitation({ direction: 'SENT' })]);
    expect(running[0]?.mine).toEqual({ avatarId: 'inviter', name: '보낸이' });
    expect(running[0]?.partner).toEqual({ avatarId: 'invitee', name: '받은이' });
  });

  it('받은 초대는 초대받은 아바타가 내 아바타, 초대한 아바타가 상대다', () => {
    const { running } = toSimulationSessions([invitation({ direction: 'RECEIVED' })]);
    expect(running[0]?.mine.avatarId).toBe('invitee');
    expect(running[0]?.partner.avatarId).toBe('inviter');
  });

  it('응답에 해시태그가 있으면 내 아바타·상대 아바타에 실어 준다', () => {
    const { running } = toSimulationSessions([
      invitation({ inviterAvatarHashtag: 'AAAAAA', inviteeAvatarHashtag: 'BBBBBB' }),
    ]);
    expect(running[0]?.mine).toEqual({ avatarId: 'inviter', name: '보낸이', hashtag: 'AAAAAA' });
    expect(running[0]?.partner).toEqual({ avatarId: 'invitee', name: '받은이', hashtag: 'BBBBBB' });
  });

  it('응답에 색이 있으면 내 아바타·상대 아바타에 실어 준다', () => {
    const { running } = toSimulationSessions([
      invitation({ inviterAvatarColor: '67C4F2', inviteeAvatarColor: 'E887B6' }),
    ]);
    expect(running[0]?.mine).toEqual({ avatarId: 'inviter', name: '보낸이', color: '67C4F2' });
    expect(running[0]?.partner).toEqual({ avatarId: 'invitee', name: '받은이', color: 'E887B6' });
  });

  it('수락됐거나 진행 중인 것은 running 으로, 나머지는 requests 로 나눈다', () => {
    const sessions = toSimulationSessions([
      invitation({ simulationInvitationId: 'accepted', status: 'ACCEPTED' }),
      invitation({ simulationInvitationId: 'in-progress', status: 'IN_PROGRESS' }),
      invitation({ simulationInvitationId: 'pending', status: 'PENDING' }),
      invitation({ simulationInvitationId: 'done', status: 'DONE' }),
      invitation({ simulationInvitationId: 'aborted', status: 'ABORTED' }),
      invitation({ simulationInvitationId: 'canceled', status: 'CANCELED' }),
    ]);
    expect(sessions.running.map((s) => s.id).sort()).toEqual(['accepted', 'in-progress']);
    expect(sessions.requests.map((s) => s.id).sort()).toEqual([
      'aborted',
      'canceled',
      'done',
      'pending',
    ]);
  });

  it('거절 · 만료된 요청은 버린다', () => {
    const sessions = toSimulationSessions([
      invitation({ status: 'REJECTED' }),
      invitation({ status: 'EXPIRED' }),
    ]);
    expect(sessions).toEqual({ running: [], requests: [] });
  });

  it('만료 시각이 지난 대기 요청은 서버가 아직 PENDING 으로 줘도 버린다', () => {
    const { requests } = toSimulationSessions([
      invitation({
        simulationInvitationId: 'overdue',
        status: 'PENDING',
        expiredAt: '2026-07-27T17:59:59+09:00',
      }),
      invitation({
        simulationInvitationId: 'due-now',
        status: 'PENDING',
        expiredAt: '2026-07-27T18:00:00+09:00',
      }),
      invitation({
        simulationInvitationId: 'waiting',
        status: 'PENDING',
        expiredAt: '2026-07-27T18:00:01+09:00',
      }),
    ]);
    expect(requests.map((s) => s.id)).toEqual(['waiting']);
  });

  it('만료 시각은 대기 요청에만 본다 — 진행 중이거나 끝난 것은 만료 시각이 지나도 남는다', () => {
    const past = '2026-07-20T12:00:00+09:00';
    const sessions = toSimulationSessions([
      invitation({ simulationInvitationId: 'running', status: 'IN_PROGRESS', expiredAt: past }),
      invitation({ simulationInvitationId: 'done', status: 'DONE', expiredAt: past }),
    ]);
    expect(sessions.running.map((s) => s.id)).toEqual(['running']);
    expect(sessions.requests.map((s) => s.id)).toEqual(['done']);
  });

  it('requests 는 응답 대기 중인 요청을 끝난 것보다 위에 두고, 묶음 안에서는 최근 요청 순이다', () => {
    const { requests } = toSimulationSessions([
      invitation({
        simulationInvitationId: 'done-new',
        status: 'DONE',
        createdAt: '2026-07-27T11:00:00+09:00',
      }),
      invitation({
        simulationInvitationId: 'pending-old',
        status: 'PENDING',
        createdAt: '2026-07-20T09:00:00+09:00',
      }),
      invitation({
        simulationInvitationId: 'canceled-old',
        status: 'CANCELED',
        createdAt: '2026-07-10T09:00:00+09:00',
      }),
      invitation({
        simulationInvitationId: 'pending-new',
        status: 'PENDING',
        createdAt: '2026-07-25T09:00:00+09:00',
      }),
    ]);
    expect(requests.map((s) => s.id)).toEqual([
      'pending-new',
      'pending-old',
      'done-new',
      'canceled-old',
    ]);
  });

  it('오프셋이 달라도 시각 기준으로 정렬한다', () => {
    const { running } = toSimulationSessions([
      invitation({ simulationInvitationId: 'old', createdAt: '2026-07-27T09:00:00+09:00' }),
      invitation({ simulationInvitationId: 'new', createdAt: '2026-07-27T03:00:00Z' }),
    ]);
    expect(running.map((s) => s.id)).toEqual(['new', 'old']);
  });

  it(`끝난 것은 최근 ${RECENT_ENDED_LIMIT}건까지만 남기고, 응답 대기 중인 요청은 줄이지 않는다`, () => {
    const ended = Array.from({ length: RECENT_ENDED_LIMIT + 3 }, (_, i) =>
      invitation({
        simulationInvitationId: `done-${i}`,
        status: 'DONE',
        createdAt: `2026-07-${String(i + 1).padStart(2, '0')}T12:00:00+09:00`,
      })
    );
    const pending = invitation({ simulationInvitationId: 'pending', status: 'PENDING' });
    const { requests } = toSimulationSessions([...ended, pending]);
    expect(requests).toHaveLength(RECENT_ENDED_LIMIT + 1);
    expect(requests[0]?.id).toBe('pending');
    expect(requests[1]?.id).toBe(`done-${RECENT_ENDED_LIMIT + 2}`);
  });
});

describe('simulationId', () => {
  it('응답에 simulationId 가 있으면 세션에 실어 주고, 없으면 키를 두지 않는다', () => {
    const { running } = toSimulationSessions([
      invitation({ simulationInvitationId: 'with', simulationId: 'sim-1' }),
      invitation({ simulationInvitationId: 'without' }),
    ]);
    expect(running.find((s) => s.id === 'with')?.simulationId).toBe('sim-1');
    expect(running.find((s) => s.id === 'without')).not.toHaveProperty('simulationId');
  });
});

describe('findSimulationSession', () => {
  it('simulationId 가 같은 초대를 세션으로 돌려준다', () => {
    const session = findSimulationSession(
      [
        invitation({ simulationInvitationId: 'other', simulationId: 'sim-0' }),
        invitation({
          simulationInvitationId: 'target',
          simulationId: 'sim-1',
          status: 'DONE',
          direction: 'RECEIVED',
        }),
      ],
      'sim-1'
    );
    expect(session).toMatchObject({
      id: 'target',
      simulationId: 'sim-1',
      status: 'DONE',
      mine: { avatarId: 'invitee' },
      partner: { avatarId: 'inviter' },
    });
  });

  it(`끝난 지 오래돼 목록의 최근 ${RECENT_ENDED_LIMIT}건에서 밀려난 세션도 찾는다`, () => {
    const ended = Array.from({ length: RECENT_ENDED_LIMIT + 3 }, (_, i) =>
      invitation({
        simulationInvitationId: `done-${i}`,
        simulationId: `sim-${i}`,
        status: 'DONE',
        createdAt: `2026-07-${String(i + 1).padStart(2, '0')}T12:00:00+09:00`,
      })
    );
    expect(findSimulationSession(ended, 'sim-0')?.id).toBe('done-0');
  });

  it('같은 simulationId 가 없으면 undefined 다', () => {
    expect(findSimulationSession([invitation({ simulationId: 'sim-1' })], 'sim-2')).toBeUndefined();
    expect(findSimulationSession([invitation({})], 'sim-1')).toBeUndefined();
  });
});

describe('toWatchSessions', () => {
  function toWatchSessions(invitations: InvitationHistoryItem[]) {
    return toWatchSessionsAt(invitations);
  }

  it('수락됐거나 진행 중인 것은 running 으로, 종료 · 중단된 것은 ended 로 나눈다', () => {
    const sessions = toWatchSessions([
      invitation({ simulationInvitationId: 'accepted', status: 'ACCEPTED' }),
      invitation({ simulationInvitationId: 'in-progress', status: 'IN_PROGRESS' }),
      invitation({ simulationInvitationId: 'done', status: 'DONE' }),
      invitation({ simulationInvitationId: 'aborted', status: 'ABORTED' }),
    ]);
    expect(sessions.running.map((s) => s.id).sort()).toEqual(['accepted', 'in-progress']);
    expect(sessions.ended.map((s) => s.id).sort()).toEqual(['aborted', 'done']);
  });

  it('대화가 열린 적 없는 요청(대기 · 취소 · 거절 · 만료)은 넣지 않는다', () => {
    expect(
      toWatchSessions([
        invitation({ status: 'PENDING' }),
        invitation({ status: 'CANCELED' }),
        invitation({ status: 'REJECTED' }),
        invitation({ status: 'EXPIRED' }),
      ])
    ).toEqual({ running: [], ended: [] });
  });

  it('묶음 안에서는 최근 요청 순이다', () => {
    const { ended } = toWatchSessions([
      invitation({
        simulationInvitationId: 'old',
        status: 'DONE',
        createdAt: '2026-07-20T09:00:00+09:00',
      }),
      invitation({
        simulationInvitationId: 'new',
        status: 'ABORTED',
        createdAt: '2026-07-25T09:00:00+09:00',
      }),
    ]);
    expect(ended.map((s) => s.id)).toEqual(['new', 'old']);
  });

  it(`끝난 것은 최근 ${RECENT_ENDED_LIMIT}건까지만 남기고, 진행 중인 것은 줄이지 않는다`, () => {
    const many = (status: 'DONE' | 'IN_PROGRESS') =>
      Array.from({ length: RECENT_ENDED_LIMIT + 2 }, (_, i) =>
        invitation({
          simulationInvitationId: `${status}-${i}`,
          status,
          createdAt: `2026-07-${String(i + 1).padStart(2, '0')}T12:00:00+09:00`,
        })
      );
    const sessions = toWatchSessions([...many('DONE'), ...many('IN_PROGRESS')]);
    expect(sessions.ended).toHaveLength(RECENT_ENDED_LIMIT);
    expect(sessions.ended[0]?.id).toBe(`DONE-${RECENT_ENDED_LIMIT + 1}`);
    expect(sessions.running).toHaveLength(RECENT_ENDED_LIMIT + 2);
  });
});
