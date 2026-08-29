import { usePrimaryAvatar } from '@entities/avatar/api/usePrimaryAvatar';

export type OnboardingCompletion = {
  hasPrimaryAvatar: boolean;
  /** false 면 아직 서버 응답 대기 중 — 이때 화면을 옮기면 안 된다. */
  isResolved: boolean;
  /** 조회 실패로 판정 불가한 상태 — 404(없음)와 다른 오류를 구분해, 오류 시 완료 회원을 온보딩으로 되돌리지 않는다. */
  isUnknown: boolean;
};

type Options = {
  /**
   * 기본 true. 비로그인 방문자도 보는 화면에서는 꺼야 한다 — 토큰 없이 조회하면 401 → refresh → clear() 가 돈다.
   * 꺼져 있는 동안 `isResolved` 는 false 로 남는다 — 호출부가 판정을 신뢰하면 안 된다.
   */
  enabled?: boolean;
};

/**
 * 완료 판정은 서버의 대표 아바타 보유 여부만으로 한다 — localStorage 진행 기록은 브라우저 단위라
 * 계정 전환을 보지 못하고, 아바타 없이도 complete 로 올라갈 수 있다.
 * 조회 실패는 미완료로 떨어뜨린다 — 완료로 오판하면 온보딩에 갇히지만, 반대 오판은 온보딩을 한 번 더 보는 것으로 끝난다.
 */
export function useOnboardingCompletion({ enabled = true }: Options = {}): OnboardingCompletion {
  const { data, isPending, isError } = usePrimaryAvatar({ enabled });

  return {
    hasPrimaryAvatar: data != null,
    isResolved: !isPending,
    isUnknown: isError,
  };
}
