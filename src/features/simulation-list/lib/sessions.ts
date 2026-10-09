import type {
  InvitationDirection,
  InvitationHistoryItem,
  InvitationStatus,
} from '@entities/match-request';

const RUNNING_STATUSES = ['ACCEPTED', 'IN_PROGRESS'] as const satisfies InvitationStatus[];
const ENDED_STATUSES = ['DONE', 'ABORTED', 'CANCELED'] as const satisfies InvitationStatus[];
const SESSION_STATUSES = ['PENDING', ...RUNNING_STATUSES, ...ENDED_STATUSES] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const RECENT_ENDED_LIMIT = 10;

type SessionAvatar = { avatarId: string; name: string; hashtag?: string };

export type SimulationSession = {
  id: string;
  status: SessionStatus;
  direction: InvitationDirection;
  mine: SessionAvatar;
  partner: SessionAvatar;
  requestedAt: string;
};

function isSessionStatus(status: InvitationStatus): status is SessionStatus {
  return (SESSION_STATUSES as readonly InvitationStatus[]).includes(status);
}

export function isRunning(status: SessionStatus): boolean {
  return (RUNNING_STATUSES as readonly SessionStatus[]).includes(status);
}

function sessionAvatar(avatarId: string, name: string, hashtag: string | undefined): SessionAvatar {
  return hashtag === undefined ? { avatarId, name } : { avatarId, name, hashtag };
}

function toSession(invitation: InvitationHistoryItem, status: SessionStatus): SimulationSession {
  const inviter = sessionAvatar(
    invitation.inviterAvatarId,
    invitation.inviterAvatarName,
    invitation.inviterAvatarHashtag
  );
  const invitee = sessionAvatar(
    invitation.inviteeAvatarId,
    invitation.inviteeAvatarName,
    invitation.inviteeAvatarHashtag
  );
  const sent = invitation.direction === 'SENT';
  return {
    id: invitation.simulationInvitationId,
    status,
    direction: invitation.direction,
    mine: sent ? inviter : invitee,
    partner: sent ? invitee : inviter,
    requestedAt: invitation.createdAt,
  };
}

export type SimulationSessions = {
  /** 수락돼 대화가 열린 것 */
  running: SimulationSession[];
  /** 응답 대기 중인 요청을 위에, 끝난 것은 최근 {@link RECENT_ENDED_LIMIT}건만 그 아래에 */
  requests: SimulationSession[];
};

export function toSimulationSessions(invitations: InvitationHistoryItem[]): SimulationSessions {
  const sessions = invitations
    .flatMap((invitation) =>
      isSessionStatus(invitation.status) ? [toSession(invitation, invitation.status)] : []
    )
    .sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt));
  const waiting = sessions.filter((session) => !isRunning(session.status));

  return {
    running: sessions.filter((session) => isRunning(session.status)),
    requests: [
      ...waiting.filter((session) => session.status === 'PENDING'),
      ...waiting.filter((session) => session.status !== 'PENDING').slice(0, RECENT_ENDED_LIMIT),
    ],
  };
}
