// avatar entity 의 TanStack Query key 단일 출처. 매칭 키(match-request/queryKeys)와 분리돼 있다.
export const avatarKeys = {
  all: () => ['avatar'] as const,
  myAvatars: () => [...avatarKeys.all(), 'my'] as const,
  primary: () => [...avatarKeys.all(), 'primary'] as const,
  candidatesAll: () => [...avatarKeys.all(), 'candidates'] as const,
  candidates: (size: number) => [...avatarKeys.candidatesAll(), size] as const,
  detail: (id: string) => [...avatarKeys.all(), 'detail', id] as const,
};
