import { FilterChip } from '@shared/ui/FilterChip';
import type { RecommendedAvatarFilter } from '@entities/dashboard';
import { toggleFilter, resetFilter, isAllActive } from '../lib/filterModel';

type FilterChipsProps = {
  filter: RecommendedAvatarFilter;
  onFilterChange: (filter: RecommendedAvatarFilter) => void;
};

const CHIPS: { label: string; key: keyof RecommendedAvatarFilter | 'all' }[] = [
  { label: '전체', key: 'all' },
  { label: '온라인', key: 'online' },
  { label: '내향', key: 'introvert' },
  { label: '외향', key: 'extrovert' },
  { label: '인증', key: 'verified' },
];

export function FilterChips({ filter, onFilterChange }: FilterChipsProps) {
  const allActive = isAllActive(filter);

  function handleToggle(key: keyof RecommendedAvatarFilter | 'all') {
    if (key === 'all') {
      onFilterChange(resetFilter());
      return;
    }
    const next = toggleFilter(filter, key);
    if (isAllActive(next)) {
      onFilterChange(resetFilter());
    } else {
      onFilterChange(next);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="아바타 필터">
      {CHIPS.map(({ label, key }) => (
        <FilterChip
          key={key}
          label={label}
          active={key === 'all' ? allActive : filter[key]}
          onToggle={() => {
            handleToggle(key);
          }}
        />
      ))}
    </div>
  );
}
