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
  // 필수다. openapi.yaml 의 SurveyAvatarCreateRequest.required 에 description 이 들어 있고,
  // 빈 문자열은 서버가 400 COMMON_400_001 로 거절한다 (api-guide §3.2).
  // GPTs 경로(GptsAvatarCreateRequest)만 nullable·optional 이라 두 경로를 혼동하지 말 것.
  description: z.string().min(1).max(200),
  answers: z.array(surveyAnswerRequestSchema).min(1),
});
export type AvatarCreateFromSurveyRequest = z.infer<typeof avatarCreateFromSurveyRequestSchema>;

export const surveyDraftSchema = z.object({
  answers: z.record(z.string(), z.string()),
  avatarName: z.string().optional(),
  description: z.string().optional(),
  // 자주 쓰는 표현(선택). 백엔드 제출 계약 미정(spec-gap)이라 draft 로컬 보관 전용이며 제출 payload 에는 포함하지 않는다.
  expressions: z.array(z.string()).optional(),
});
export type SurveyDraft = z.infer<typeof surveyDraftSchema>;

// 백엔드 계약 v2:
//   - connectCode 는 Custom GPT 측 발급 정책에 따라 포맷이 가변(예: 길이/구분자 변경)
//     이라 정규식 제약을 두지 않는다. 형식 검증은 백엔드 단일 출처에 위임.
//     단, 빈 문자열은 클라이언트에서도 명백한 계약 위반이므로 min(1) 만 강제.
//   - expiresIn 은 백엔드가 함께 반환하는 잔여 초 단위 정보. 현재 카운트다운은
//     expiresAt 단일 소스로 계산하므로 사용하지 않으나, 시계 동기화 어긋남이나
//     향후 server-pushed 갱신 시 활용을 위해 스키마에 보존.
export const connectCodeSchema = z.object({
  connectCode: z.string().min(1),
  expiresIn: z.number().int().positive(),
  // 서버는 OffsetDateTime 을 `2026-07-27T12:15:00+09:00` 형태로 직렬화한다 (api-guide §1.3).
  // Zod 의 .datetime() 기본값은 UTC `Z` 만 허용하므로 offset 을 켜야 실서버 응답이 파싱된다.
  expiresAt: z.string().datetime({ offset: true }),
});
export type ConnectCode = z.infer<typeof connectCodeSchema>;

export const connectStatusSchema = z.object({
  status: z.enum(['active', 'connected', 'expired']),
});
export type ConnectStatus = z.infer<typeof connectStatusSchema>;

// 값 범위는 avatarStatsSchema 와 같은 이유로 소수를 허용한다 — 서버 stats 는 double 이다.
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
