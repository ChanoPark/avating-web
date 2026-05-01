import type { RecommendedAvatarFilter } from './model';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  recommended: (filter: RecommendedAvatarFilter) =>
    [...dashboardKeys.all, 'recommended', filter] as const,
};
