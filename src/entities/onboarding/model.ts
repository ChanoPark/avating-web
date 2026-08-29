import { z } from 'zod';

export const surveyQuestionAnswerSchema = z.object({
  answerId: z.string(),
  text: z.string(),
});
export type SurveyQuestionAnswer = z.infer<typeof surveyQuestionAnswerSchema>;

export const surveyQuestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  primaryType: z.string(),
  questionType: z.literal('SINGLE_CHOICE_5'),
  answers: z.array(surveyQuestionAnswerSchema),
});
export type SurveyQuestion = z.infer<typeof surveyQuestionSchema>;

export const apiResponseSurveyQuestionsSchema = z.object({
  data: z.array(surveyQuestionSchema).min(1),
});

export const surveyAnswerRequestSchema = z.object({
  questionId: z.string(),
  questionType: z.literal('SINGLE_CHOICE_5'),
  answerId: z.string(),
});
export type SurveyAnswerRequest = z.infer<typeof surveyAnswerRequestSchema>;

export const avatarCreateFromSurveyRequestSchema = z.object({
  avatarName: z.string().min(1).max(50),
  // description 필수(api-guide §3.2) — 빈 문자열은 서버가 400 COMMON_400_001 로 거절한다. GPTs 경로만 optional 이다.
  description: z.string().min(1).max(200),
  answers: z.array(surveyAnswerRequestSchema).min(1),
});
export type AvatarCreateFromSurveyRequest = z.infer<typeof avatarCreateFromSurveyRequestSchema>;

export const surveyDraftSchema = z.object({
  answers: z.record(z.string(), z.string()),
  avatarName: z.string().optional(),
  description: z.string().optional(),
  // 자주 쓰는 표현(선택). 백엔드 제출 계약이 아직 정해지지 않아(spec-gap) draft 로만 로컬에
  // 보관하고 제출 payload 에는 포함하지 않는다.
  expressions: z.array(z.string()).optional(),
});
export type SurveyDraft = z.infer<typeof surveyDraftSchema>;

// connectCode 는 GPT 측 발급 정책에 따라 포맷이 바뀔 수 있어 정규식 없이 min(1) 만 강제한다 — 형식 검증은 백엔드에 맡긴다.
// expiresIn 은 지금 안 쓰지만(카운트다운은 expiresAt 로 계산) 향후 활용을 위해 스키마엔 남긴다.
export const connectCodeSchema = z.object({
  connectCode: z.string().min(1),
  expiresIn: z.number().int().positive(),
  // 서버 OffsetDateTime(`+09:00`, api-guide §1.3)이라 .datetime({ offset: true }) 없인 실서버 응답이 깨진다.
  expiresAt: z.string().datetime({ offset: true }),
});
export type ConnectCode = z.infer<typeof connectCodeSchema>;

export const connectStatusSchema = z.object({
  status: z.enum(['active', 'connected', 'expired']),
});
export type ConnectStatus = z.infer<typeof connectStatusSchema>;

// 서버 stats 는 double 이다(avatarStatsSchema 와 동일 근거로 소수 허용).
const generatedStatValue = z.number().min(0).max(100);

export const generatedAvatarStatsSchema = z.object({
  empathy: generatedStatValue,
  proactivity: generatedStatValue,
  humor: generatedStatValue,
  sensitivity: generatedStatValue,
  listening: generatedStatValue,
  expressiveness: generatedStatValue,
});

export const generatedAvatarSchema = z.object({
  initials: z.string().min(1).max(4),
  name: z.string().min(1).max(30),
  handle: z.string().regex(/^@[a-zA-Z0-9_]{2,30}$/),
  level: z.number().int().nonnegative(),
  type: z.string().min(1),
  stats: generatedAvatarStatsSchema,
  tags: z.array(z.string().min(1)).max(6),
});
export type GeneratedAvatar = z.infer<typeof generatedAvatarSchema>;

export const avatarCreateFromSurveyResponseSchema = z.object({
  data: z.object({ avatarId: z.string().min(1) }),
});
export type AvatarCreateFromSurveyResponse = z.infer<
  typeof avatarCreateFromSurveyResponseSchema
>['data'];

export const apiResponseConnectCode = z.object({ data: connectCodeSchema });
export const apiResponseConnectStatus = z.object({ data: connectStatusSchema });
export const apiResponseGeneratedAvatar = z.object({ data: generatedAvatarSchema });
export const apiResponseCompleteOnboarding = z.object({
  // connectCode.expiresAt 과 같은 이유로 offset 을 허용한다 (서버 OffsetDateTime).
  data: z.object({ completedAt: z.string().datetime({ offset: true }) }),
});
