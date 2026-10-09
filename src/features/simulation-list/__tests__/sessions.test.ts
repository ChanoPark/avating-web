import { describe, it, expect } from 'vitest';
import type { InvitationHistoryItem } from '@entities/match-request';
import { RECENT_ENDED_LIMIT, toSimulationSessions } from '../lib/sessions';

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
