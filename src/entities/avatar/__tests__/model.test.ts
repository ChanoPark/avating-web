import { describe, it, expect } from 'vitest';
import {
  avatarStatusSchema,
  avatarBaseSchema,
  avatarStatsSchema,
  avatarPublicInfoSchema,
  avatarDetailSchema,
  AVATAR_STAT_KEYS,
} from '../model';

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

const validStats = {
  empathy: 81,
  proactivity: 52,
  humor: 69,
  sensitivity: 88,
  listening: 74,
  expressiveness: 60,
};

describe('avatarStatsSchema', () => {
  it('6축 0–100 정수 객체를 파싱한다', () => {
    expect(avatarStatsSchema.parse(validStats)).toEqual(validStats);
  });

  it('AVATAR_STAT_KEYS 는 6개여야 한다', () => {
    expect(AVATAR_STAT_KEYS).toHaveLength(6);
  });

  it('범위 외 값(>100) 은 실패한다', () => {
    expect(() => avatarStatsSchema.parse({ ...validStats, empathy: 101 })).toThrow();
  });

  it('음수는 실패한다', () => {
    expect(() => avatarStatsSchema.parse({ ...validStats, humor: -1 })).toThrow();
  });

  it('소수를 허용한다 (서버 stats 는 double)', () => {
    expect(avatarStatsSchema.safeParse({ ...validStats, listening: 70.5 }).success).toBe(true);
  });

  it('필수 키 누락 시 실패한다', () => {
    const { listening: _omit, ...without } = validStats;
    expect(() => avatarStatsSchema.parse(without)).toThrow();
  });
});

describe('avatarPublicInfoSchema', () => {
  const validPublicInfo = { ageRange: '20대 후반', region: '서울 서북부', job: '콘텐츠 기획' };

  it('나이대/지역/직군 객체를 파싱한다', () => {
    expect(avatarPublicInfoSchema.parse(validPublicInfo)).toEqual(validPublicInfo);
  });

  it('필수 필드가 빈 문자열이면 실패한다', () => {
    expect(() => avatarPublicInfoSchema.parse({ ...validPublicInfo, region: '' })).toThrow();
  });

  it('필드 누락 시 실패한다', () => {
    const { job: _omit, ...without } = validPublicInfo;
    expect(() => avatarPublicInfoSchema.parse(without)).toThrow();
  });
});

describe('avatarDetailSchema', () => {
  const validDetail = {
    ...validAvatarBase,
    type: '내향·낭만형',
    description: '심야의 책방을 좋아하는 낭만가.',
    tags: ['독립서점', '심야 카페'],
    stats: validStats,
    publicInfo: { ageRange: '20대 후반', region: '서울 서북부', job: '콘텐츠 기획' },
  };

  it('base + type + description + tags + stats + publicInfo 를 모두 파싱한다', () => {
    const parsed = avatarDetailSchema.parse(validDetail);
    expect(parsed.tags).toHaveLength(2);
    expect(parsed.stats.empathy).toBe(81);
    expect(parsed.publicInfo.region).toBe('서울 서북부');
    expect(parsed.description.length).toBeGreaterThan(0);
  });

  it('상대 아바타 정보에 세션 이력(호감도·턴) 필드는 포함되지 않는다 (프라이버시)', () => {
    const parsed = avatarDetailSchema.parse({
      ...validDetail,
      sessionHistory: [{ id: 'x', turn: 1, totalTurns: 12, affinity: 50, result: 'ended' }],
    });
    expect(parsed).not.toHaveProperty('sessionHistory');
  });

  it('type 이 빈 문자열이면 실패한다', () => {
    expect(() => avatarDetailSchema.parse({ ...validDetail, type: '' })).toThrow();
  });

  it('publicInfo 가 누락되면 실패한다', () => {
    const { publicInfo: _omit, ...without } = validDetail;
    expect(() => avatarDetailSchema.parse(without)).toThrow();
  });
});
