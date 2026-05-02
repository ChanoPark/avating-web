import { describe, it, expect } from 'vitest';
import {
  surveyResponseSchema,
  connectCodeSchema,
  connectStatusSchema,
  generatedAvatarSchema,
  apiResponseConnectCode,
  apiResponseConnectStatus,
  apiResponseGeneratedAvatar,
  apiResponseSurveySubmit,
  apiResponseSurveyDraft,
  apiResponseCompleteOnboarding,
} from '../model';

describe('surveyResponseSchema', () => {
  const validSurvey = {
    q1: 'solo',
    q2: 'wait',
    q3: 'cafe',
    q4: 'brief',
    q5: 'calm',
    q6: 'conversation',
  };

  it('6 문항 모두 enum 정상 입력 시 파싱에 성공한다', () => {
    const result = surveyResponseSchema.safeParse(validSurvey);
    expect(result.success).toBe(true);
  });

  it('q1에 enum 외 값 입력 시 throw 한다', () => {
    expect(() => surveyResponseSchema.parse({ ...validSurvey, q1: 'invalid' })).toThrow();
  });

  it('q2에 enum 외 값 입력 시 throw 한다', () => {
    expect(() => surveyResponseSchema.parse({ ...validSurvey, q2: 'invalid' })).toThrow();
  });

  it('q3에 enum 외 값 입력 시 throw 한다', () => {
    expect(() => surveyResponseSchema.parse({ ...validSurvey, q3: 'invalid' })).toThrow();
  });

  it('q6에 enum 외 값 입력 시 throw 한다', () => {
    expect(() => surveyResponseSchema.parse({ ...validSurvey, q6: 'invalid' })).toThrow();
  });

  it('필드가 누락되면 throw 한다', () => {
    const { q6: _q6, ...partial } = validSurvey;
    expect(() => surveyResponseSchema.parse(partial)).toThrow();
  });
});

describe('connectCodeSchema', () => {
  const validExpiresAt = '2026-05-01T12:00:00.000Z';

  it('AVT-A1B2-C3 패턴은 파싱에 성공한다', () => {
    const result = connectCodeSchema.safeParse({
      code: 'AVT-A1B2-C3',
      expiresAt: validExpiresAt,
      status: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('소문자 코드는 파싱에 실패한다 (AVT-abcd-ef)', () => {
    const result = connectCodeSchema.safeParse({
      code: 'AVT-abcd-ef',
      expiresAt: validExpiresAt,
      status: 'active',
    });
    expect(result.success).toBe(false);
  });

  it('형식이 다른 코드 INVALID 는 파싱에 실패한다', () => {
    const result = connectCodeSchema.safeParse({
      code: 'INVALID',
      expiresAt: validExpiresAt,
      status: 'active',
    });
    expect(result.success).toBe(false);
  });

  it('expiresAt 이 ISO datetime 이 아니면 throw 한다', () => {
    expect(() =>
      connectCodeSchema.parse({
        code: 'AVT-A1B2-C3',
        expiresAt: 'not-a-date',
        status: 'active',
      })
    ).toThrow();
  });

  it('status 가 enum 외 값이면 throw 한다', () => {
    expect(() =>
      connectCodeSchema.parse({
        code: 'AVT-A1B2-C3',
        expiresAt: validExpiresAt,
        status: 'unknown',
      })
    ).toThrow();
  });

  it('status 가 connected 이면 파싱에 성공한다', () => {
    const result = connectCodeSchema.safeParse({
      code: 'AVT-A1B2-C3',
      expiresAt: validExpiresAt,
      status: 'connected',
    });
    expect(result.success).toBe(true);
  });

  it('status 가 expired 이면 파싱에 성공한다', () => {
    const result = connectCodeSchema.safeParse({
      code: 'AVT-A1B2-C3',
      expiresAt: validExpiresAt,
      status: 'expired',
    });
    expect(result.success).toBe(true);
  });
});

describe('connectStatusSchema', () => {
  it('active 상태는 파싱에 성공한다', () => {
    const result = connectStatusSchema.safeParse({ status: 'active' });
    expect(result.success).toBe(true);
  });

  it('connected 상태는 파싱에 성공한다', () => {
    const result = connectStatusSchema.safeParse({ status: 'connected' });
    expect(result.success).toBe(true);
  });

  it('expired 상태는 파싱에 성공한다', () => {
    const result = connectStatusSchema.safeParse({ status: 'expired' });
    expect(result.success).toBe(true);
  });

  it('enum 외 상태는 throw 한다', () => {
    expect(() => connectStatusSchema.parse({ status: 'pending' })).toThrow();
  });
});

describe('generatedAvatarSchema', () => {
  const validAvatar = {
    initials: 'AB',
    name: '루나',
    handle: '@luna_av',
    level: 3,
    type: '내향 · 분석형',
    stats: {
      extroversion: 40,
      sensitivity: 70,
      enthusiasm: 55,
      dateStyle: 80,
    },
    tags: ['독서', '카페투어', '음악감상'],
  };

  it('유효한 아바타 데이터는 파싱에 성공한다', () => {
    const result = generatedAvatarSchema.safeParse(validAvatar);
    expect(result.success).toBe(true);
  });

  it('tags 가 6개이면 파싱에 성공한다', () => {
    const result = generatedAvatarSchema.safeParse({
      ...validAvatar,
      tags: ['태그1', '태그2', '태그3', '태그4', '태그5', '태그6'],
    });
    expect(result.success).toBe(true);
  });

  it('tags 가 7개이면 throw 한다', () => {
    expect(() =>
      generatedAvatarSchema.parse({
        ...validAvatar,
        tags: ['태그1', '태그2', '태그3', '태그4', '태그5', '태그6', '태그7'],
      })
    ).toThrow();
  });

  it('stats.extroversion 이 100 초과이면 throw 한다', () => {
    expect(() =>
      generatedAvatarSchema.parse({
        ...validAvatar,
        stats: { ...validAvatar.stats, extroversion: 101 },
      })
    ).toThrow();
  });

  it('stats.sensitivity 가 0 미만이면 throw 한다', () => {
    expect(() =>
      generatedAvatarSchema.parse({
        ...validAvatar,
        stats: { ...validAvatar.stats, sensitivity: -1 },
      })
    ).toThrow();
  });

  it('stats 는 정수여야 한다 (float 이면 throw)', () => {
    expect(() =>
      generatedAvatarSchema.parse({
        ...validAvatar,
        stats: { ...validAvatar.stats, enthusiasm: 55.5 },
      })
    ).toThrow();
  });

  it('handle 이 @ 없이 시작하면 throw 한다', () => {
    expect(() => generatedAvatarSchema.parse({ ...validAvatar, handle: 'luna_av' })).toThrow();
  });

  it('initials 가 빈 문자열이면 throw 한다', () => {
    expect(() => generatedAvatarSchema.parse({ ...validAvatar, initials: '' })).toThrow();
  });

  it('initials 가 4자이면 파싱에 성공한다', () => {
    const result = generatedAvatarSchema.safeParse({ ...validAvatar, initials: 'ABCD' });
    expect(result.success).toBe(true);
  });

  it('initials 가 5자이면 throw 한다', () => {
    expect(() => generatedAvatarSchema.parse({ ...validAvatar, initials: 'ABCDE' })).toThrow();
  });
});

describe('apiResponseConnectCode', () => {
  it('data 필드가 있는 유효한 응답은 파싱에 성공한다', () => {
    const result = apiResponseConnectCode.safeParse({
      data: {
        code: 'AVT-A1B2-C3',
        expiresAt: '2026-05-01T12:00:00.000Z',
        status: 'active',
      },
    });
    expect(result.success).toBe(true);
  });

  it('data 필드가 없으면 throw 한다', () => {
    expect(() => apiResponseConnectCode.parse({ code: 'AVT-A1B2-C3' })).toThrow();
  });

  it('data.code 가 잘못된 패턴이면 throw 한다', () => {
    expect(() =>
      apiResponseConnectCode.parse({
        data: {
          code: 'INVALID',
          expiresAt: '2026-05-01T12:00:00.000Z',
          status: 'active',
        },
      })
    ).toThrow();
  });
});

describe('apiResponseConnectStatus', () => {
  it('유효한 status 응답은 파싱에 성공한다', () => {
    const result = apiResponseConnectStatus.safeParse({ data: { status: 'active' } });
    expect(result.success).toBe(true);
  });

  it('data 필드가 없으면 throw 한다', () => {
    expect(() => apiResponseConnectStatus.parse({ status: 'active' })).toThrow();
  });
});

describe('apiResponseGeneratedAvatar', () => {
  it('유효한 아바타 응답 envelope 은 파싱에 성공한다', () => {
    const result = apiResponseGeneratedAvatar.safeParse({
      data: {
        initials: 'AB',
        name: '루나',
        handle: '@luna_av',
        level: 3,
        type: '내향 · 분석형',
        stats: { extroversion: 40, sensitivity: 70, enthusiasm: 55, dateStyle: 80 },
        tags: ['독서'],
      },
    });
    expect(result.success).toBe(true);
  });

  it('data 필드가 없으면 throw 한다', () => {
    expect(() => apiResponseGeneratedAvatar.parse({ name: '루나' })).toThrow();
  });
});

describe('apiResponseSurveySubmit', () => {
  it('유효한 avatarId 응답은 파싱에 성공한다', () => {
    const result = apiResponseSurveySubmit.safeParse({ data: { avatarId: 'avatar-123' } });
    expect(result.success).toBe(true);
  });

  it('data.avatarId 가 빈 문자열이면 throw 한다', () => {
    expect(() => apiResponseSurveySubmit.parse({ data: { avatarId: '' } })).toThrow();
  });

  it('data 필드가 없으면 throw 한다', () => {
    expect(() => apiResponseSurveySubmit.parse({ avatarId: 'avatar-123' })).toThrow();
  });
});

describe('apiResponseSurveyDraft', () => {
  it('유효한 savedAt 응답은 파싱에 성공한다', () => {
    const result = apiResponseSurveyDraft.safeParse({
      data: { savedAt: '2026-05-01T12:00:00.000Z' },
    });
    expect(result.success).toBe(true);
  });

  it('savedAt 이 ISO datetime 이 아니면 throw 한다', () => {
    expect(() => apiResponseSurveyDraft.parse({ data: { savedAt: 'not-a-date' } })).toThrow();
  });
});

describe('apiResponseCompleteOnboarding', () => {
  it('유효한 completedAt 응답은 파싱에 성공한다', () => {
    const result = apiResponseCompleteOnboarding.safeParse({
      data: { completedAt: '2026-05-01T12:00:00.000Z' },
    });
    expect(result.success).toBe(true);
  });

  it('data 필드가 없으면 throw 한다', () => {
    expect(() =>
      apiResponseCompleteOnboarding.parse({ completedAt: '2026-05-01T12:00:00.000Z' })
    ).toThrow();
  });
});
