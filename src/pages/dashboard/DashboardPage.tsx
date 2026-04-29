import { useState } from 'react';
import { useNavigate } from 'react-router';
import { StatsGrid } from '@features/dashboard/ui/StatsGrid';
import { AvatarList } from '@features/dashboard/ui/AvatarList';
import { FilterChips } from '@features/dashboard/ui/FilterChips';
import type { RecommendedAvatarFilter } from '@entities/dashboard';
import { initialFilter, selectAll } from '@features/dashboard/lib/filterModel';

export function DashboardPage() {
  const [filter, setFilter] = useState<RecommendedAvatarFilter>(initialFilter);
  const navigate = useNavigate();

  function handleAvatarClick(id: string) {
    void navigate(`/avatars/${id}`);
  }

  function handleResetFilter() {
    setFilter(selectAll());
  }

  return (
    <div className="flex flex-col gap-6">
      <StatsGrid />

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
