import { usePrimaryAvatar } from '@entities/avatar/api/usePrimaryAvatar';

export type OnboardingCompletion = {
  /** 온보딩 완료 여부의 정본 — 이 회원에게 대표 아바타가 있는가. */
  hasPrimaryAvatar: boolean;
  /** 판정이 끝났는지. false 면 아직 서버 응답을 기다리는 중이라 화면을 옮기면 안 된다. */
  isResolved: boolean;
  /**
   * 조회 자체가 실패해 판정할 수 없었는지.
   * "확인해보니 대표 아바타가 없다"(404) 와 "확인을 못 했다"(그 밖의 오류) 는 구분해야 한다 —
   * 뒤섞으면 서버가 잠깐 흔들린 것만으로 완료한 회원을 온보딩으로 되돌려보내게 된다.
   */
  isUnknown: boolean;
};

/**
 * 온보딩을 마쳤는지 판정한다.
 *
 * localStorage 의 진행 기록은 브라우저 단위라 계정 전환을 보지 못하고, 아바타를 만들지 않고도
 * `complete` 로 올라가던 경로가 있었다. 그래서 완료 판정은 서버가 가진 대표 아바타 유무로만 한다.
 * (첫 아바타는 서버가 자동으로 대표로 지정한다 — openapi `POST /api/avatars/survey` 설명)
 *
 * 조회에 실패하면 미완료로 떨어뜨린다 — 완료로 잘못 판정하면 온보딩 진입 자체가 막혀
 * 사용자가 스스로 빠져나올 방법이 없어진다. 반대 방향의 오판은 온보딩을 한 번 더 보는 것으로 끝난다.
 */
export function useOnboardingCompletion(): OnboardingCompletion {
  const { data, isPending, isError } = usePrimaryAvatar();

  return {
    hasPrimaryAvatar: data != null,
    isResolved: !isPending,
    isUnknown: isError,
  };
}
