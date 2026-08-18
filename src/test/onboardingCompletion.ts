import { QueryClient } from '@tanstack/react-query';
import { avatarKeys } from '@entities/avatar';
import type { AvatarSummary } from '@entities/avatar';

/**
 * 온보딩 완료 판정(대표 아바타 보유 여부)을 확정한 QueryClient 를 만든다.
 *
 * 판정은 `GET /api/avatars/primary` 를 타므로, 캐시를 미리 채우지 않으면 화면이
 * "아직 모름" 으로 렌더된 뒤 네트워크 응답에 따라 늦게 바뀐다. 가드 동작을 보는 테스트가
 * 그 타이밍에 흔들리지 않도록 여기서 결과를 못박는다.
 *
 * `null` 은 "대표 아바타 없음" 이라는 확정 상태다 (조회 실패와 다르다).
 */
export function queryClientWithPrimaryAvatar(primary: AvatarSummary | null = null): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData<AvatarSummary | null>(avatarKeys.primary(), primary);
  return queryClient;
}

/** 대표 아바타 고정 픽스처 — 완료 상태를 만들 때 쓴다. */
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
