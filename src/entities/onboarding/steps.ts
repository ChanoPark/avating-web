export const ONBOARDING_TOTAL_STEPS = 4;

export type OnboardingRoute =
  | '/onboarding/welcome'
  | '/onboarding/method'
  | '/onboarding/survey'
  | '/onboarding/connect'
  | '/onboarding/complete';

type StepDescriptor = {
  step: 1 | 2 | 3 | 4;
  label: string;
};

export const ONBOARDING_STEPS: Record<OnboardingRoute, StepDescriptor> = {
  '/onboarding/welcome': { step: 1, label: '시작' },
  '/onboarding/method': { step: 2, label: '방법 선택' },
  '/onboarding/survey': { step: 3, label: '성향 설문' },
  '/onboarding/connect': { step: 3, label: 'Bot 대화' },
  '/onboarding/complete': { step: 4, label: '아바타 확인' },
};

export const ONBOARDING_FALLBACK_LABELS = ['시작', '방법 선택', '아바타 생성', '아바타 확인'];
