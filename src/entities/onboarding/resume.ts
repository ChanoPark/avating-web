import { getOnboardingMethod, getOnboardingProgress } from './progress';
import type { OnboardingResumeRoute } from './steps';

/**
 * 온보딩에서 이어서 진행할 화면을 정한다.
 *
 * 완료 판정의 정본은 **대표 아바타 보유 여부**(`hasPrimaryAvatar`)다. localStorage 의 진행 기록은
 * "어디까지 입력했나" 만 말해주며 완료를 보장하지 않는다 — 브라우저 단위라 계정 전환을 못 보고,
 * 아바타를 만들지 않고도 `complete` 로 올라가던 경로가 있었다(ConnectStep '생성된 결과 확인').
 * 그래서 진행 기록은 재개 위치를 고르는 데만 쓰고, 완료 여부는 서버가 준 대표 아바타로 판단한다.
 */
export function resolveResumeRoute(hasPrimaryAvatar: boolean): OnboardingResumeRoute {
  if (hasPrimaryAvatar) return '/onboarding/complete';

  const progress = getOnboardingProgress();

  switch (progress) {
    // welcome 은 진행바 없는 환영 모멘트(pre-step)라 그 자체가 재개 지점이 되진 않는다 —
    // 방법을 고른 기록이 없을 때만 아래에서 되돌아간다.
    case 'welcome':
    case 'intro':
      return '/onboarding/intro';
    // 아바타가 없는데 기록만 complete 인 경우는 생성이 끝나지 않은 것이므로
    // creating 과 같게 취급해 생성 단계로 되돌린다.
    case 'creating':
    case 'complete': {
      const method = getOnboardingMethod();
      if (method === 'connect') return '/onboarding/connect';
      if (method === 'survey') return '/onboarding/survey';
      // 방법을 고른 기록이 없으면 고르는 자리로 되돌린다 — 둘 중 하나를 임의로 택하면
      // 사용자가 고르지 않은 경로로 밀어넣게 된다. v2.6 부터 그 자리는 환영 화면이다.
      return '/onboarding/welcome';
    }
  }
}
