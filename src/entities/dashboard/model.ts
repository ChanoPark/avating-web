import { z } from 'zod';

export const dashboardStatsSchema = z.object({
  totalDispatched: z.number().int().nonnegative(),
  totalDispatchedDelta: z.number().int(),
  avgAffinity: z.number().min(0).max(100),
  avgAffinityDelta: z.number(),
  matches: z.number().int().nonnegative(),
  matchRate: z.number().min(0).max(100),
  interventionsThisWeek: z.number().int().nonnegative(),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

export const apiResponseDashboardStats = z.object({ data: dashboardStatsSchema });
