export const ONBOARDING_TOTAL_STEPS = 3;

// 와이어프레임 v2.6: welcome 은 진행바 없는 브랜드 환영 모멘트(pre-step)라 단계 매핑에서 제외한다.
// 생성 방법도 그 환영 화면의 카드에서 고르므로 별도 선택 화면이 없다 (정본 wf-app.jsx §02 SecNote:
// "위저드 셸은 3단계 고정입니다. 생성 방법은 S-02-01 카드에서 고르며 별도 선택 화면은 없습니다").
// Step 1 이름·설명(intro), Step 2 설문/Bot, Step 3 아바타 확인.
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
 * 라벨은 스텝 레일이 그대로 쓴다. Step 2 만 경로가 둘(설문·Bot 연동)이라 갈리고,
 * 나머지는 `ONBOARDING_FALLBACK_LABELS` 와 같은 값이어야 한다 — 다르면 어느 경로로 들어왔느냐에
 * 따라 레일 문구가 흔들린다.
 *
 * Step 2 의 Bot 경로 라벨(`ChatGPT Bot 대화`)은 정본과의 **의도된 divergence** 다. 정본 SecNote 는
 * "레일 라벨은 '성향 설문'을 유지" 라고 하지만, 실서버 QA S8-3 에서 Bot 연동 중에 레일이
 * '성향 설문 진행 중' 으로 보이는 문제가 나왔다. 2026-08-21 사용자 결정으로 현재 동작을 유지한다.
 */
export const ONBOARDING_STEPS: Record<OnboardingRoute, StepDescriptor> = {
  '/onboarding/intro': { step: 1, label: '아바타 기본 정보' },
  '/onboarding/survey': { step: 2, label: '성향 설문' },
  '/onboarding/connect': { step: 2, label: 'ChatGPT Bot 대화' },
  '/onboarding/complete': { step: 3, label: '아바타 확인' },
};

/**
 * 온보딩 위저드 스텝 레일의 3단계 라벨. 표시 라벨의 단일 출처다 —
 * `pages/onboarding/ui/WizardShell` 이 이걸 import 해 레일을 그린다.
 *
 * 정본: `.claude/design/2026-08-21-wireframe-v2.6/wf/wf-kit-excerpt.jsx` `ONB_STEPS`.
 * S-02-01 환영 화면의 체크리스트 문구(`기본 정보 입력` 등)와는 다른 계열이니
 * 그쪽을 이 상수로 대체하지 않는다.
 */
export const ONBOARDING_FALLBACK_LABELS = ['아바타 기본 정보', '성향 설문', '아바타 확인'] as const;
