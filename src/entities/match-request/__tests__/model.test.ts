import { describe, it, expect } from 'vitest';
import {
  matchRequestSchema,
  matchRequestStatusSchema,
  myAvatarSchema,
  sendMatchRequestSchema,
} from '../model';

describe('matchRequestStatusSchema', () => {
  it.each([['pending'], ['accepted'], ['rejected'], ['expired']] as const)(
    '%s 는 valid 상태',
    (status) => {
      expect(matchRequestStatusSchema.parse(status)).toBe(status);
    }
  );

  it('알 수 없는 상태는 reject', () => {
    expect(() => matchRequestStatusSchema.parse('archived')).toThrow();
  });
});

describe('matchRequestSchema', () => {
  it('완전한 payload 를 parse 한다', () => {
    const payload = {
      id: 'req-1',
      requesterUserId: 'u-a',
      requesterAvatarId: 'av-a',
      partnerUserId: 'u-b',
      partnerAvatarId: 'av-b',
      greeting: '안녕하세요',
      status: 'pending',
      rejectionReason: null,
      createdAt: '2026-05-06T05:00:00.000Z',
      respondedAt: null,
      expiresAt: '2026-05-07T05:00:00.000Z',
    };
    expect(() => matchRequestSchema.parse(payload)).not.toThrow();
  });

  it('greeting=null 도 허용한다', () => {
    const payload = {
      id: 'req-1',
      requesterUserId: 'u-a',
      requesterAvatarId: 'av-a',
      partnerUserId: 'u-b',
      partnerAvatarId: 'av-b',
      greeting: null,
      status: 'rejected',
      rejectionReason: '관심사가 달라요',
      createdAt: '2026-05-06T05:00:00.000Z',
      respondedAt: '2026-05-06T05:30:00.000Z',
      expiresAt: '2026-05-07T05:00:00.000Z',
    };
    expect(() => matchRequestSchema.parse(payload)).not.toThrow();
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

describe('myAvatarSchema', () => {
  it('busy + isPrimary 필드를 포함한다', () => {
    const result = myAvatarSchema.parse({
      id: 'me-1',
      initials: 'HW',
      name: 'hyunwoo',
      handle: '@hyunwoo',
      level: 1,
      status: 'online',
      verified: true,
      type: '내향·분석형',
      isPrimary: true,
      busy: false,
    });
    expect(result.isPrimary).toBe(true);
    expect(result.busy).toBe(false);
  });
});
