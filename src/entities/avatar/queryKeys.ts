// avatar entity 의 TanStack Query key 단일 출처.
// 다른 entity 의 매칭 키 (match-request/queryKeys) 와 분리되어 있고,
// avatar 도메인 안에서 myAvatars / detail 등 sub-key 로 확장한다.
export const avatarKeys = {
  all: () => ['avatar'] as const,
  myAvatars: () => [...avatarKeys.all(), 'my'] as const,
  detail: (id: string) => [...avatarKeys.all(), 'detail', id] as const,
};
