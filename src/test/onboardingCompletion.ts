import { QueryClient } from '@tanstack/react-query';
import { avatarKeys } from '@entities/avatar';
import type { AvatarSummary } from '@entities/avatar';

// GET /api/avatars/primary 캐시를 미리 채워 둔다 — 안 채우면 화면이 '아직 모름' 으로 먼저
// 렌더된 뒤 응답에 따라 바뀌어 테스트가 타이밍에 흔들린다. null 은 '대표 아바타 없음' 확정
// 상태다(조회 실패와 다르다).
export function queryClientWithPrimaryAvatar(primary: AvatarSummary | null = null): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData<AvatarSummary | null>(avatarKeys.primary(), primary);
  return queryClient;
}

export const SAMPLE_PRIMARY_AVATAR: AvatarSummary = {
  schemaVersion: 1,
  avatarId: '11111111-1111-4111-8111-111111111111',
  name: '루시',
  description: '따뜻하고 유머 감각 넘치는 ENFP',
  stats: {
    OPENNESS: 72.5,
    IMAGINATION: 68,
    EXTROVERSION: 80,
    EMPATHY: 65,
    PLANNING_LEVEL: 45,
    HUMOROUS: 88,
    AFFECTION_EXPRESSION: 55,
  },
};
