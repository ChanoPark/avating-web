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
    <div className="flex flex-col gap-6">
      <StatsGrid />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <MyAvatarGrid />
        <InboxPanel />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-ui text-heading text-text">추천 아바타</h2>
          <FilterChips filter={filter} onFilterChange={setFilter} />
        </div>

        <div className="border-border bg-bg-elev-2 overflow-hidden rounded-md border">
          <AvatarList
            filter={filter}
            onAvatarClick={handleAvatarClick}
            onResetFilter={handleResetFilter}
          />
        </div>
      </div>
    </div>
  );
}
