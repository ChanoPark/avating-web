export const ONBOARDING_TOTAL_STEPS = 3;

// welcome 은 진행바 없는 pre-step 이라 단계 매핑에서 제외한다 — 생성 방법도 별도 화면 없이 그 카드에서 고른다.
export type OnboardingRoute =
  | '/onboarding/intro'
  | '/onboarding/survey'
  | '/onboarding/connect'
  | '/onboarding/complete';

/** 재개 지점은 단계 화면이거나, 방법을 아직 고르지 않았다면 환영 화면이다. */
export type OnboardingResumeRoute = OnboardingRoute | '/onboarding/welcome';

type StepDescriptor = {
  step: 1 | 2 | 3;
  label: string;
};

/**
 * 라벨은 `ONBOARDING_FALLBACK_LABELS` 와 같아야 한다(Step 2 의 설문·Bot 경로만 예외) — 다르면 진입 경로에 따라 레일 문구가 흔들린다.
 * Bot 라벨(`ChatGPT Bot 대화`)은 정본 SecNote 와의 의도된 divergence — Bot 연동 중에 `성향 설문` 이 뜨지 않게 하려는 것이다.
 */
export const ONBOARDING_STEPS: Record<OnboardingRoute, StepDescriptor> = {
  '/onboarding/intro': { step: 1, label: '아바타 기본 정보' },
  '/onboarding/survey': { step: 2, label: '성향 설문' },
  '/onboarding/connect': { step: 2, label: 'ChatGPT Bot 대화' },
  '/onboarding/complete': { step: 3, label: '아바타 확인' },
};

/** 스텝 레일 라벨의 단일 출처 — S-02-01 환영 화면 체크리스트 문구와는 다른 계열이니 섞지 않는다. */
export const ONBOARDING_FALLBACK_LABELS = ['아바타 기본 정보', '성향 설문', '아바타 확인'] as const;
