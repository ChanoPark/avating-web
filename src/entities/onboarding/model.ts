import { z } from 'zod';

export const surveyResponseSchema = z.object({
  q1: z.enum(['solo', 'few', 'crowd', 'mood']),
  q2: z.enum(['wait', 'signal', 'active', 'situation']),
  q3: z.enum(['cafe', 'culture', 'outdoor', 'food']),
  q4: z.enum(['brief', 'detailed', 'match', 'offline']),
  q5: z.enum(['calm', 'talk', 'wait_conflict', 'avoid']),
  q6: z.enum(['conversation', 'hobby', 'stability', 'excitement']),
});
export type SurveyResponse = z.infer<typeof surveyResponseSchema>;

export const surveyDraftSchema = surveyResponseSchema.partial();
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

export const apiResponseSurveySubmit = z.object({
  data: z.object({ avatarId: z.string().min(1) }),
});

export const apiResponseSurveyDraft = z.object({
  data: z.object({ savedAt: z.string().datetime() }),
});

export const apiResponseConnectCode = z.object({ data: connectCodeSchema });

export const apiResponseConnectStatus = z.object({ data: connectStatusSchema });

export const apiResponseGeneratedAvatar = z.object({ data: generatedAvatarSchema });

export const apiResponseCompleteOnboarding = z.object({
  data: z.object({ completedAt: z.string().datetime() }),
});
