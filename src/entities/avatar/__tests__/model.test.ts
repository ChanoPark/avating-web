import { describe, it, expect } from 'vitest';
import { avatarStatusSchema, avatarBaseSchema, apiResponseAvatarDetail } from '../model';

const validAvatarBase = {
  id: 'avatar-1',
  initials: 'HW',
  name: 'Moonlit',
  level: 3,
  status: 'online' as const,
  verified: true,
};

describe('avatarStatusSchema', () => {
  it('online 은 정상 파싱된다', () => {
    expect(avatarStatusSchema.parse('online')).toBe('online');
  });

  it('busy 는 정상 파싱된다', () => {
    expect(avatarStatusSchema.parse('busy')).toBe('busy');
  });

  it('offline 은 정상 파싱된다', () => {
    expect(avatarStatusSchema.parse('offline')).toBe('offline');
  });

  it('임의 문자열은 실패한다', () => {
    expect(() => avatarStatusSchema.parse('inactive')).toThrow();
  });

  it('빈 문자열은 실패한다', () => {
    expect(() => avatarStatusSchema.parse('')).toThrow();
  });

  it('숫자는 실패한다', () => {
    expect(() => avatarStatusSchema.parse(1)).toThrow();
  });
});

describe('avatarBaseSchema', () => {
  it('정상 객체를 파싱한다', () => {
    const result = avatarBaseSchema.parse(validAvatarBase);
    expect(result.id).toBe('avatar-1');
    expect(result.initials).toBe('HW');
    expect(result.name).toBe('Moonlit');
    expect(result.level).toBe(3);
    expect(result.status).toBe('online');
    expect(result.verified).toBe(true);
  });

  it('initials 가 3자이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, initials: 'ABC' })).toThrow();
  });

  it('initials 가 빈 문자열이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, initials: '' })).toThrow();
  });

  it('level 이 0이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, level: 0 })).toThrow();
  });

  it('level 이 소수이면 실패한다 (int 강제)', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, level: 1.5 })).toThrow();
  });

  it('status 가 임의 문자열이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, status: 'away' })).toThrow();
  });

  it('추가 필드는 무시된다 (Zod strip 기본 동작)', () => {
    const result = avatarBaseSchema.parse({ ...validAvatarBase, extra: 'ignored' });
    expect(result).not.toHaveProperty('extra');
  });

  it('id 가 빈 문자열이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, id: '' })).toThrow();
  });

  it('name 이 빈 문자열이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, name: '' })).toThrow();
  });

  it('handle 은 스키마에 없다 — 응답에 남아 있어도 결과에서 빠진다', () => {
    expect(avatarBaseSchema.parse({ ...validAvatarBase, handle: '@moonlit' })).not.toHaveProperty(
      'handle'
    );
  });

  it('verified 가 없으면 실패한다', () => {
    const { verified: _omit, ...without } = validAvatarBase;
    expect(() => avatarBaseSchema.parse(without)).toThrow();
  });
});

// 서버 AvatarDetailResponse(GET /api/avatars/{avatarId}) — avating-core db29da9.
describe('apiResponseAvatarDetail', () => {
  const parseDetail = (data: unknown) => apiResponseAvatarDetail.parse({ data }).data;

  const validDetail = {
    avatarId: '11111111-1111-4111-8111-111111111111',
    name: '루시',
    hashtag: 'A3K9Z7',
    description: '따뜻하고 유머 감각 넘치는 ENFP',
    color: 'FF8800',
    stats: { OPENNESS: 72.5, AFFECTION_EXPRESSION: 55 },
    tags: ['운동', '여행'],
    canRequestSimulation: true,
  };

  it('실서버 응답 형상을 그대로 파싱한다', () => {
    expect(parseDetail(validDetail)).toEqual(validDetail);
  });

  it('color 키가 없는 배포본 응답도 파싱한다 (core 0ed8958 배포 전)', () => {
    const { color: _omit, ...without } = validDetail;
    expect(parseDetail(without)).not.toHaveProperty('color');
  });

  it('canRequestSimulation 이 없으면 실패한다', () => {
    const { canRequestSimulation: _omit, ...without } = validDetail;
    expect(() => parseDetail(without)).toThrow();
  });

  it('상대 아바타 정보에 세션 이력(호감도·턴) 필드는 포함되지 않는다 (프라이버시)', () => {
    const parsed = parseDetail({
      ...validDetail,
      sessionHistory: [{ id: 'x', turn: 1, totalTurns: 12, affinity: 50, result: 'ended' }],
    });
    expect(parsed).not.toHaveProperty('sessionHistory');
  });
});
