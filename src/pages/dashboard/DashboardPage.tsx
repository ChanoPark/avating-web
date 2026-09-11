import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { StatsGrid, StatsRetryAction } from '@features/dashboard/ui/StatsGrid';
import { AvatarList } from '@features/dashboard/ui/AvatarList';
import { FilterChips } from '@features/dashboard/ui/FilterChips';
import { MyAvatarGrid } from '@features/dashboard/ui/MyAvatarGrid';
import { InboxPanel } from '@features/dashboard/ui/InboxPanel';
import type { RecommendedAvatarFilter } from '@entities/dashboard';
import { dashboardKeys } from '@entities/dashboard';
import { initialFilter, resetFilter } from '@features/dashboard/lib/filterModel';

export function DashboardPage() {
  const [filter, setFilter] = useState<RecommendedAvatarFilter>(initialFilter);
  // 카드마다 경계를 따로 두되 재시도는 묶음 단위다(정본 S-11-06). 액션을 두 열 바깥에 두어야
  // 좌우 열의 윗단이 맞고, stat↔알림 세로 간격이 열 사이 가로 간격(14px)과 같아진다.
  const [statsResetKey, setStatsResetKey] = useState(0);
  const [failedStatCount, setFailedStatCount] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleAvatarClick(id: string) {
    void navigate(`/avatars/${id}`);
  }

  function handleStatCardFailed() {
    setFailedStatCount((c) => c + 1);
  }

  function handleStatsRetry() {
    setFailedStatCount(0);
    setStatsResetKey((k) => k + 1);
  }

  function handleResetFilter() {
    const newFilter = resetFilter();
    setFilter(newFilter);
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.recommended(newFilter) });
  }

  return (
    <div className="flex flex-col gap-3.5">
      {failedStatCount > 0 && <StatsRetryAction onRetry={handleStatsRetry} />}
      <div className="flex flex-col items-stretch gap-3.5 lg:flex-row">
        <div className="lg:w-75 lg:shrink-0">
          <MyAvatarGrid />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <StatsGrid resetKey={statsResetKey} onCardFailed={handleStatCardFailed} />
          <InboxPanel />
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lead text-primary">추천 아바타</h2>
          <span className="text-meta text-secondary">내 아바타 성향과 결이 비슷한 순서예요</span>
        </div>
        <FilterChips filter={filter} onFilterChange={setFilter} />
      </div>

      <AvatarList
        filter={filter}
        onAvatarClick={handleAvatarClick}
        onResetFilter={handleResetFilter}
      />
    </div>
  );
}
