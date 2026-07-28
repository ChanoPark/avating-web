export const ONBOARDING_TOTAL_STEPS = 4;

// 와이어프레임 v2: welcome 은 진행바 없는 브랜드 환영 모멘트(pre-step)라 단계 매핑에서 제외한다.
// Step 1 은 신규 '이름·설명'(intro), Step 2 방법 선택, Step 3 설문/Bot, Step 4 아바타 확인.
export type OnboardingRoute =
  | '/onboarding/intro'
  | '/onboarding/method'
  | '/onboarding/survey'
  | '/onboarding/connect'
  | '/onboarding/complete';

type StepDescriptor = {
  step: 1 | 2 | 3 | 4;
  label: string;
};

export const ONBOARDING_STEPS: Record<OnboardingRoute, StepDescriptor> = {
  '/onboarding/intro': { step: 1, label: '아바타 기본 정보' },
  '/onboarding/method': { step: 2, label: '아바타 생성 방법' },
  '/onboarding/survey': { step: 3, label: '성향 설문' },
  '/onboarding/connect': { step: 3, label: 'ChatGPT Bot 대화' },
  '/onboarding/complete': { step: 4, label: '아바타 확인' },
};

/**
 * 온보딩 위저드 스텝 레일의 4단계 라벨. 표시 라벨의 단일 출처다 —
 * `pages/onboarding/ui/WizardShell` 이 이걸 import 해 레일을 그린다.
 *
 * 정본: `.claude/design/2026-07-26-wireframe-v2/` 의 `wf/wf-kit.jsx` `ONB_STEPS`.
 * S-02-01 환영 화면의 체크리스트 문구(`기본 정보 입력` 등)와는 다른 계열이니
 * 그쪽을 이 상수로 대체하지 않는다.
 */
export const ONBOARDING_FALLBACK_LABELS = [
  '아바타 기본 정보',
  '생성 방법 선택',
  '성향 설문',
  '아바타 확인',
] as const;
