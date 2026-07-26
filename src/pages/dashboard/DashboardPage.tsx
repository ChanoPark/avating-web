import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { StatsGrid } from '@features/dashboard/ui/StatsGrid';
import { AvatarList } from '@features/dashboard/ui/AvatarList';
import { FilterChips } from '@features/dashboard/ui/FilterChips';
import { MyAvatarGrid } from '@features/dashboard/ui/MyAvatarGrid';
import { InboxPanel } from '@features/dashboard/ui/InboxPanel';
import type { RecommendedAvatarFilter } from '@entities/dashboard';
import { dashboardKeys } from '@entities/dashboard';
import { initialFilter, resetFilter } from '@features/dashboard/lib/filterModel';

export function DashboardPage() {
  const [filter, setFilter] = useState<RecommendedAvatarFilter>(initialFilter);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleAvatarClick(id: string) {
    void navigate(`/avatars/${id}`);
  }

  function handleResetFilter() {
    const newFilter = resetFilter();
    setFilter(newFilter);
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.recommended(newFilter) });
  }

  return (
    // wf-s2-core `ScreenDashboard` — 본문 세로 gap 14.
    <div className="flex flex-col gap-3.5">
      {/* 상단 행: 좌 내 아바타 카드 폭 300 고정 / 우 flex 1 */}
      <div className="flex flex-col items-stretch gap-3.5 lg:flex-row">
        <div className="lg:w-75 lg:shrink-0">
          <MyAvatarGrid />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <StatsGrid />
          <InboxPanel />
        </div>
      </div>

      {/* 하단: 추천 아바타 제목 + 부제 / 우측 필터 */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-heading-sm text-ink">추천 아바타</h2>
          <span className="text-micro text-ink-mute">내 아바타 성향과 결이 비슷한 순서예요</span>
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
