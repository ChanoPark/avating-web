import { z } from 'zod';
import { avatarBaseSchema } from '@entities/avatar/model';

export const dashboardStatsSchema = z.object({
  totalDispatched: z.number().int().nonnegative(),
  totalDispatchedDelta: z.number().int(),
  avgAffinity: z.number().min(0).max(100),
  avgAffinityDelta: z.number(),
  matches: z.number().int().nonnegative(),
  matchRate: z.number().min(0).max(100),
  interventionsThisWeek: z.number().int().nonnegative(),
  gemsUsed: z.number().int().nonnegative(),
  gemsBalance: z.number().int().nonnegative(),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

export const recommendedAvatarSchema = avatarBaseSchema.extend({
  type: z.string().min(1),
  tags: z.array(z.string()).max(8),
  matchRate: z.number().min(0).max(100),
});
export type RecommendedAvatar = z.infer<typeof recommendedAvatarSchema>;

export const recommendedAvatarFilterSchema = z.object({
  online: z.boolean(),
  introvert: z.boolean(),
  extrovert: z.boolean(),
  verified: z.boolean(),
});
export type RecommendedAvatarFilter = z.infer<typeof recommendedAvatarFilterSchema>;

export const recommendedAvatarsResponseSchema = z.object({
  items: z.array(recommendedAvatarSchema),
  nextCursor: z.string().nullable(),
});
export type RecommendedAvatarsResponse = z.infer<typeof recommendedAvatarsResponseSchema>;

export const createSessionRequestSchema = z.object({ avatarId: z.string().min(1) });
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;

export const createSessionResponseSchema = z.object({
  sessionId: z.string().min(1),
  avatarId: z.string().min(1),
  startedAt: z.string(),
});
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

export const apiResponseDashboardStats = z.object({ data: dashboardStatsSchema });
export const apiResponseRecommendedAvatars = z.object({ data: recommendedAvatarsResponseSchema });
export const apiResponseCreateSession = z.object({ data: createSessionResponseSchema });
