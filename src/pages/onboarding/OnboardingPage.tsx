import { Outlet, useLocation } from 'react-router';
import { ONBOARDING_STEPS, type OnboardingRoute } from '@entities/onboarding';
import { WizardShell } from './ui/WizardShell';

function isOnboardingRoute(pathname: string): pathname is OnboardingRoute {
  return pathname in ONBOARDING_STEPS;
}

// 레일 하단 각주 — wf-s1-entry.jsx 의 `Page note` 값. 각주가 없는 화면도 있다.
const RAIL_NOTES: Partial<Record<OnboardingRoute, string>> = {
  '/onboarding/intro': '이름과 설명은 나중에 프로필에서 수정할 수 있어요.',
  '/onboarding/connect': '약 10분 소요 · 대화가 길수록 아바타가 정확해집니다.',
  '/onboarding/complete': '확정 이후 스탯은 튜닝 기능으로만 조정할 수 있어요.',
};

export function OnboardingPage() {
  const location = useLocation();
  // welcome 은 레일 없는 플랫 환영 모멘트(pre-step)라 단계 매핑에서 제외된다.
  // 매핑된 단계(intro~complete)에서만 스텝 레일을 렌더한다.
  const route = isOnboardingRoute(location.pathname) ? location.pathname : null;
  const descriptor = route !== null ? ONBOARDING_STEPS[route] : null;
  const note = route !== null ? RAIL_NOTES[route] : undefined;

  return (
    <WizardShell
      currentStep={descriptor?.step ?? null}
      animationKey={location.pathname}
      {...(descriptor !== null ? { currentStepLabel: descriptor.label } : {})}
      {...(note !== undefined ? { note } : {})}
    >
      <Outlet />
    </WizardShell>
  );
}
