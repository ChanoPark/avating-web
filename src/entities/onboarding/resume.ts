import { getOnboardingMethod, getOnboardingProgress } from './progress';
import type { OnboardingResumeRoute } from './steps';

/** 재개 화면을 고른다 — hasPrimaryAvatar 가 완료의 유일한 기준이고(useOnboardingCompletion 참조), 진행 기록은 재개 위치 힌트로만 쓴다. */
export function resolveResumeRoute(hasPrimaryAvatar: boolean): OnboardingResumeRoute {
  if (hasPrimaryAvatar) return '/onboarding/complete';

  const progress = getOnboardingProgress();

  switch (progress) {
    // welcome 은 pre-step 이라 재개 지점이 되지 않는다.
    case 'welcome':
    case 'intro':
      return '/onboarding/intro';
    // 아바타 없이 complete 기록만 있으면 미완료로 보고 creating 과 동일하게 처리한다.
    case 'creating':
    case 'complete': {
      const method = getOnboardingMethod();
      if (method === 'connect') return '/onboarding/connect';
      if (method === 'survey') return '/onboarding/survey';
      // 방법 기록이 없으면 welcome 으로 되돌린다 — survey/connect 중 하나를 임의로 고르면 안 된다.
      return '/onboarding/welcome';
    }
  }
}
