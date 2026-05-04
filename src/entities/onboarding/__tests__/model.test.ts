import { describe, it, expect } from 'vitest';
import {
  surveyQuestionSchema,
  surveyAnswerRequestSchema,
  avatarCreateFromSurveyRequestSchema,
  avatarCreateFromSurveyResponseSchema,
  apiResponseSurveyQuestionsSchema,
  surveyDraftSchema,
  connectCodeSchema,
  connectStatusSchema,
  generatedAvatarSchema,
  apiResponseConnectCode,
  apiResponseConnectStatus,
  apiResponseGeneratedAvatar,
  apiResponseCompleteOnboarding,
} from '../model';

describe('surveyQuestionSchema', () => {
  const validQuestion = {
    id: 'AFFECTION_EXPRESSION_0001',
    title: '질문 텍스트',
    primaryType: 'AFFECTION_EXPRESSION',
    questionType: 'SINGLE_CHOICE_5' as const,
    answers: [
      { answerId: 'AFFECTION_EXPRESSION_0001_ANS_1', text: '선택지 1' },
      { answerId: 'AFFECTION_EXPRESSION_0001_ANS_2', text: '선택지 2' },
    ],
  };

  it('유효한 질문 데이터는 파싱에 성공한다', () => {
    expect(surveyQuestionSchema.safeParse(validQuestion).success).toBe(true);
  });

  it('questionType 이 SINGLE_CHOICE_5 가 아니면 throw 한다', () => {
    expect(() =>
      surveyQuestionSchema.parse({ ...validQuestion, questionType: 'MULTI_CHOICE' })
    ).toThrow();
  });

  it('answers 가 없으면 throw 한다', () => {
    const { answers: _a, ...rest } = validQuestion;
    expect(() => surveyQuestionSchema.parse(rest)).toThrow();
  });
});

describe('surveyAnswerRequestSchema', () => {
  const validAnswer = {
    questionId: 'AFFECTION_EXPRESSION_0001',
    questionType: 'SINGLE_CHOICE_5' as const,
    answerId: 'AFFECTION_EXPRESSION_0001_ANS_1',
  };

  it('유효한 답변 요청은 파싱에 성공한다', () => {
    expect(surveyAnswerRequestSchema.safeParse(validAnswer).success).toBe(true);
  });

  it('questionType 이 SINGLE_CHOICE_5 가 아니면 throw 한다', () => {
    expect(() =>
      surveyAnswerRequestSchema.parse({ ...validAnswer, questionType: 'OTHER' })
    ).toThrow();
  });
});

describe('avatarCreateFromSurveyRequestSchema', () => {
  const validRequest = {
    avatarName: '루나',
    description: '내향적인 아바타',
    answers: [
      {
        questionId: 'Q_001',
        questionType: 'SINGLE_CHOICE_5' as const,
        answerId: 'Q_001_ANS_1',
      },
    ],
  };

  it('유효한 요청은 파싱에 성공한다', () => {
    expect(avatarCreateFromSurveyRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it('avatarName 이 빈 문자열이면 throw 한다', () => {
    expect(() =>
      avatarCreateFromSurveyRequestSchema.parse({ ...validRequest, avatarName: '' })
    ).toThrow();
  });

  it('answers 가 빈 배열이면 throw 한다', () => {
    expect(() =>
      avatarCreateFromSurveyRequestSchema.parse({ ...validRequest, answers: [] })
    ).toThrow();
  });

  it('avatarName 이 50자 경계는 통과한다', () => {
    const name50 = 'a'.repeat(50);
    expect(
      avatarCreateFromSurveyRequestSchema.safeParse({ ...validRequest, avatarName: name50 }).success
    ).toBe(true);
  });

  it('avatarName 이 51자면 throw 한다', () => {
    const name51 = 'a'.repeat(51);
    expect(() =>
      avatarCreateFromSurveyRequestSchema.parse({ ...validRequest, avatarName: name51 })
    ).toThrow();
  });

  it('description 이 200자 경계는 통과한다', () => {
    const desc200 = 'a'.repeat(200);
    expect(
      avatarCreateFromSurveyRequestSchema.safeParse({ ...validRequest, description: desc200 })
        .success
    ).toBe(true);
  });

  it('description 이 201자면 throw 한다', () => {
    const desc201 = 'a'.repeat(201);
    expect(() =>
      avatarCreateFromSurveyRequestSchema.parse({ ...validRequest, description: desc201 })
    ).toThrow();
  });
});

describe('apiResponseSurveyQuestionsSchema', () => {
  it('data 배열이 있는 유효한 응답은 파싱에 성공한다', () => {
    const result = apiResponseSurveyQuestionsSchema.safeParse({
      data: [
        {
          id: 'Q_001',
          title: '질문',
          primaryType: 'EXTROVERSION',
          questionType: 'SINGLE_CHOICE_5',
          answers: [{ answerId: 'Q_001_ANS_1', text: '선택지' }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('data 가 없으면 throw 한다', () => {
    expect(() => apiResponseSurveyQuestionsSchema.parse({})).toThrow();
  });

  it('data 가 빈 배열이면 throw 한다 (백엔드 빈 응답으로 인한 화면 깨짐 방지)', () => {
    expect(() => apiResponseSurveyQuestionsSchema.parse({ data: [] })).toThrow();
  });
});

describe('avatarCreateFromSurveyResponseSchema', () => {
  it('avatarId 가 있는 유효한 응답은 파싱에 성공한다', () => {
    expect(
      avatarCreateFromSurveyResponseSchema.safeParse({ data: { avatarId: 'avatar-001' } }).success
    ).toBe(true);
  });

  it('avatarId 가 빈 문자열이면 throw 한다', () => {
    expect(() => avatarCreateFromSurveyResponseSchema.parse({ data: { avatarId: '' } })).toThrow();
  });

  it('avatarId 필드가 없으면 throw 한다', () => {
    expect(() => avatarCreateFromSurveyResponseSchema.parse({ data: {} })).toThrow();
  });
});

describe('surveyDraftSchema', () => {
  it('answers 와 선택적 필드가 있는 유효한 draft 는 파싱에 성공한다', () => {
    const result = surveyDraftSchema.safeParse({
      answers: { Q_001: 'Q_001_ANS_1', Q_002: 'Q_002_ANS_3' },
      avatarName: '루나',
      description: '소개글',
    });
    expect(result.success).toBe(true);
  });

  it('avatarName, description 없이 answers 만 있어도 파싱에 성공한다', () => {
    const result = surveyDraftSchema.safeParse({
      answers: { Q_001: 'Q_001_ANS_2' },
    });
    expect(result.success).toBe(true);
  });

  it('answers 가 없으면 throw 한다', () => {
    expect(() => surveyDraftSchema.parse({ avatarName: '루나' })).toThrow();
  });
});

describe('connectCodeSchema', () => {
  const validExpiresAt = '2026-05-01T12:00:00.000Z';
  const validCode = {
    connectCode: 'AVT-A1B2-C3',
    expiresIn: 600,
    expiresAt: validExpiresAt,
  };

  it('필수 필드를 갖춘 유효한 응답은 파싱에 성공한다', () => {
    expect(connectCodeSchema.safeParse(validCode).success).toBe(true);
  });

  it('connectCode 필드가 없으면 throw 한다', () => {
    const { connectCode: _, ...rest } = validCode;
    expect(() => connectCodeSchema.parse(rest)).toThrow();
  });

  it('expiresIn 이 양수 정수가 아니면 throw 한다', () => {
    expect(() => connectCodeSchema.parse({ ...validCode, expiresIn: 0 })).toThrow();
    expect(() => connectCodeSchema.parse({ ...validCode, expiresIn: -1 })).toThrow();
  });

  it('expiresAt 이 ISO datetime 이 아니면 throw 한다', () => {
    expect(() => connectCodeSchema.parse({ ...validCode, expiresAt: 'not-a-date' })).toThrow();
  });
});

describe('connectStatusSchema', () => {
  it('active 상태는 파싱에 성공한다', () => {
    expect(connectStatusSchema.safeParse({ status: 'active' }).success).toBe(true);
  });

  it('connected 상태는 파싱에 성공한다', () => {
    expect(connectStatusSchema.safeParse({ status: 'connected' }).success).toBe(true);
  });

  it('expired 상태는 파싱에 성공한다', () => {
    expect(connectStatusSchema.safeParse({ status: 'expired' }).success).toBe(true);
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
    expect(generatedAvatarSchema.safeParse(validAvatar).success).toBe(true);
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
    expect(generatedAvatarSchema.safeParse({ ...validAvatar, initials: 'ABCD' }).success).toBe(
      true
    );
  });

  it('initials 가 5자이면 throw 한다', () => {
    expect(() => generatedAvatarSchema.parse({ ...validAvatar, initials: 'ABCDE' })).toThrow();
  });
});

describe('apiResponseConnectCode', () => {
  it('data 필드가 있는 유효한 응답은 파싱에 성공한다', () => {
    const result = apiResponseConnectCode.safeParse({
      data: {
        connectCode: 'AVT-A1B2-C3',
        expiresIn: 600,
        expiresAt: '2026-05-01T12:00:00.000Z',
      },
    });
    expect(result.success).toBe(true);
  });

  it('data 필드가 없으면 throw 한다', () => {
    expect(() => apiResponseConnectCode.parse({ connectCode: 'AVT-A1B2-C3' })).toThrow();
  });

  it('data.expiresAt 이 유효하지 않으면 throw 한다', () => {
    expect(() =>
      apiResponseConnectCode.parse({
        data: {
          connectCode: 'AVT-A1B2-C3',
          expiresIn: 600,
          expiresAt: 'not-a-date',
        },
      })
    ).toThrow();
  });
});

describe('apiResponseConnectStatus', () => {
  it('유효한 status 응답은 파싱에 성공한다', () => {
    expect(apiResponseConnectStatus.safeParse({ data: { status: 'active' } }).success).toBe(true);
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
