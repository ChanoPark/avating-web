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
  data: z.array(surveyQuestionSchema),
});

export const surveyAnswerRequestSchema = z.object({
  questionId: z.string(),
  questionType: z.literal('SINGLE_CHOICE_5'),
  answerId: z.string(),
});
export type SurveyAnswerRequest = z.infer<typeof surveyAnswerRequestSchema>;

export const avatarCreateFromSurveyRequestSchema = z.object({
  avatarName: z.string().min(1),
  description: z.string(),
  answers: z.array(surveyAnswerRequestSchema).min(1),
});
export type AvatarCreateFromSurveyRequest = z.infer<typeof avatarCreateFromSurveyRequestSchema>;

export const surveyDraftSchema = z.object({
  answers: z.record(z.string(), z.string()),
  avatarName: z.string().optional(),
  description: z.string().optional(),
});
export type SurveyDraft = z.infer<typeof surveyDraftSchema>;

export const connectCodeSchema = z.object({
  code: z.string().regex(/^AVT-[A-Z0-9]{4}-[A-Z0-9]{2}$/),
  expiresAt: z.string().datetime(),
  status: z.enum(['active', 'connected', 'expired']),
});
export type ConnectCode = z.infer<typeof connectCodeSchema>;

export const connectStatusSchema = z.object({
  status: z.enum(['active', 'connected', 'expired']),
});
export type ConnectStatus = z.infer<typeof connectStatusSchema>;

export const generatedAvatarStatsSchema = z.object({
  extroversion: z.number().int().min(0).max(100),
  sensitivity: z.number().int().min(0).max(100),
  enthusiasm: z.number().int().min(0).max(100),
  dateStyle: z.number().int().min(0).max(100),
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

export const apiResponseConnectCode = z.object({ data: connectCodeSchema });
export const apiResponseConnectStatus = z.object({ data: connectStatusSchema });
export const apiResponseGeneratedAvatar = z.object({ data: generatedAvatarSchema });
export const apiResponseCompleteOnboarding = z.object({
  data: z.object({ completedAt: z.string().datetime() }),
});
