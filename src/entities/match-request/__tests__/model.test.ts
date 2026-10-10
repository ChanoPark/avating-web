import { describe, it, expect } from 'vitest';
import {
  apiResponseCreateInvitation,
  apiResponseInvitationHistoryPage,
  invitationStatusSchema,
  sendMatchRequestSchema,
} from '../model';

describe('invitationStatusSchema (서버 InvitationStatus)', () => {
  it.each([
    ['PENDING'],
    ['ACCEPTED'],
    ['IN_PROGRESS'],
    ['REJECTED'],
    ['CANCELED'],
    ['ABORTED'],
    ['EXPIRED'],
    ['DONE'],
  ] as const)('%s 는 valid 상태', (status) => {
    expect(invitationStatusSchema.parse(status)).toBe(status);
  });

  it('알 수 없는 상태는 reject', () => {
    expect(() => invitationStatusSchema.parse('pending')).toThrow();
  });
});

describe('apiResponseCreateInvitation (서버 CreateInvitationResponse)', () => {
  const created = {
    simulationInvitationId: '123e4567-e89b-12d3-a456-426655440000',
    inviterAvatarName: 'test1',
    inviterAvatarHashtag: 'A3K9Z7',
    inviteeAvatarName: 'test2',
    inviteeAvatarHashtag: 'B7X2M4',
    status: 'PENDING',
    expiredAt: '2026-07-28T12:00:00+09:00',
  };

  it('실서버 응답 형상을 그대로 파싱한다 (expiredAt 은 +09:00 오프셋)', () => {
    expect(apiResponseCreateInvitation.parse({ data: created }).data).toEqual(created);
  });

  it('expiredAt 이 ISO-8601 이 아니면 거부한다', () => {
    expect(() =>
      apiResponseCreateInvitation.parse({ data: { ...created, expiredAt: '내일' } })
    ).toThrow();
  });

  it('simulationInvitationId 가 빠지면 거부한다', () => {
    const { simulationInvitationId: _omitted, ...rest } = created;
    expect(() => apiResponseCreateInvitation.parse({ data: rest })).toThrow();
  });
});

describe('apiResponseInvitationHistoryPage (서버 CursorPage<InvitationHistoryResponse>)', () => {
  const invitation = {
    simulationInvitationId: '123e4567-e89b-12d3-a456-426655440000',
    inviterAvatarId: '11111111-1111-4111-8111-111111111111',
    inviterAvatarName: 'test1',
    inviteeAvatarId: '22222222-2222-4222-8222-222222222222',
    inviteeAvatarName: 'test2',
    status: 'IN_PROGRESS',
    direction: 'SENT',
    expiredAt: '2026-07-28T12:00:00+09:00',
    createdAt: '2026-07-27T12:00:00+09:00',
  };

  it('null 필드가 키째 빠진 실서버 응답을 파싱한다 (nextCursor · requestMessage · rejectMessage)', () => {
    const page = { content: [invitation], hasNext: false };
    expect(apiResponseInvitationHistoryPage.parse({ data: page }).data).toEqual(page);
  });

  it('메시지·해시태그·색·simulationId·nextCursor 가 있으면 보존한다', () => {
    const full = {
      ...invitation,
      simulationId: '9f1c2d3e-0000-4000-8000-000000000001',
      inviterAvatarHashtag: 'A3K9Z7',
      inviteeAvatarHashtag: 'B7X2M4',
      inviterAvatarColor: '67C4F2',
      inviteeAvatarColor: 'E887B6',
      requestMessage: '대화해봐요',
      rejectMessage: '다음에요',
    };
    const page = { content: [full], nextCursor: 'eyJjcmVhdGVkQXQiOiJ4In0', hasNext: true };
    expect(apiResponseInvitationHistoryPage.parse({ data: page }).data).toEqual(page);
  });

  it('아바타 색이 # 없는 6자리 hex 가 아니면 거부한다', () => {
    expect(() =>
      apiResponseInvitationHistoryPage.parse({
        data: { content: [{ ...invitation, inviteeAvatarColor: '#67C4F2' }], hasNext: false },
      })
    ).toThrow();
  });

  it('direction 이 SENT · RECEIVED 가 아니면 거부한다', () => {
    expect(() =>
      apiResponseInvitationHistoryPage.parse({
        data: { content: [{ ...invitation, direction: 'BOTH' }], hasNext: false },
      })
    ).toThrow();
  });

  it('createdAt 이 ISO-8601 이 아니면 거부한다', () => {
    expect(() =>
      apiResponseInvitationHistoryPage.parse({
        data: { content: [{ ...invitation, createdAt: '어제' }], hasNext: false },
      })
    ).toThrow();
  });

  it('hasNext 가 빠지면 거부한다', () => {
    expect(() => apiResponseInvitationHistoryPage.parse({ data: { content: [] } })).toThrow();
  });
});

describe('sendMatchRequestSchema', () => {
  it('정상 입력은 parse 된다', () => {
    const result = sendMatchRequestSchema.parse({
      partnerAvatarId: 'av-b',
      requesterAvatarId: 'av-a',
      greeting: '안녕하세요',
    });
    expect(result.greeting).toBe('안녕하세요');
  });

  it('requesterAvatarId 가 비어 있으면 한국어 에러 메시지를 반환한다', () => {
    const result = sendMatchRequestSchema.safeParse({
      partnerAvatarId: 'av-b',
      requesterAvatarId: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('사용할 아바타를 선택해주세요');
    }
  });

  it('greeting 100자 초과 시 reject', () => {
    const result = sendMatchRequestSchema.safeParse({
      partnerAvatarId: 'av-b',
      requesterAvatarId: 'av-a',
      greeting: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('greeting 공백만 있으면 trim → undefined', () => {
    const result = sendMatchRequestSchema.parse({
      partnerAvatarId: 'av-b',
      requesterAvatarId: 'av-a',
      greeting: '   ',
    });
    expect(result.greeting).toBeUndefined();
  });
});
