import type { RecommendedAvatarFilter } from '@entities/dashboard/model';

export const initialFilter: RecommendedAvatarFilter = {
  online: false,
  introvert: false,
  extrovert: false,
  verified: false,
};

export function toggleFilter(
  filter: RecommendedAvatarFilter,
  key: keyof RecommendedAvatarFilter
): RecommendedAvatarFilter {
  return { ...filter, [key]: !filter[key] };
}

export function selectAll(_filter?: RecommendedAvatarFilter): RecommendedAvatarFilter {
  return { online: false, introvert: false, extrovert: false, verified: false };
}

export function isAllActive(filter: RecommendedAvatarFilter): boolean {
  return !filter.online && !filter.introvert && !filter.extrovert && !filter.verified;
}

export function serializeFilter(filter: RecommendedAvatarFilter): string {
  const active: string[] = [];
  if (filter.online) active.push('online');
  if (filter.introvert) active.push('introvert');
  if (filter.extrovert) active.push('extrovert');
  if (filter.verified) active.push('verified');
  return active.join(',');
}
