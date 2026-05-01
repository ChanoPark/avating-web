import { useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseDashboardStats, dashboardKeys } from '@entities/dashboard';
import type { DashboardStats } from '@entities/dashboard';

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await http.get('/api/dashboard/stats');
  const parsed = apiResponseDashboardStats.parse(response.data);
  return parsed.data;
}

export function useDashboardStats(): DashboardStats {
  const { data } = useSuspenseQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
  return data;
}
