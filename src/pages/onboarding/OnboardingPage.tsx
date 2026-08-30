import { Outlet, useLocation } from 'react-router';
import { ONBOARDING_STEPS, type OnboardingRoute } from '@entities/onboarding';
import { WizardShell } from './ui/WizardShell';

function isOnboardingRoute(pathname: string): pathname is OnboardingRoute {
  return pathname in ONBOARDING_STEPS;
}

const RAIL_NOTES: Partial<Record<OnboardingRoute, string>> = {
  '/onboarding/intro': '이름과 설명은 나중에 프로필에서 수정할 수 있어요.',
  '/onboarding/connect': '약 10분 소요 · 대화가 길수록 아바타가 정확해집니다.',
  // 스탯 튜닝(스탯 다듬기) UI 는 2026-08-30 서버 7지표 전환으로 제거돼 안내도 확인 문구로 교체.
  '/onboarding/complete': '생성된 아바타를 확인한 뒤 완료를 눌러 주세요.',
};

const WELCOME_ROUTE = '/onboarding/welcome';

const WELCOME_NOTE = '어느 방법을 골라도 아래 3단계를 거칩니다 · 방법은 여기서만 선택합니다';

export function OnboardingPage() {
  const location = useLocation();
  // welcome 은 레일 없는 플랫 화면이라 단계 매핑에서 제외되고, 매핑된 단계(intro~complete)에서만 레일을 렌더한다.
  const route = isOnboardingRoute(location.pathname) ? location.pathname : null;
  const descriptor = route !== null ? ONBOARDING_STEPS[route] : null;
  const isWelcome = location.pathname === WELCOME_ROUTE;
  const note = route !== null ? RAIL_NOTES[route] : isWelcome ? WELCOME_NOTE : undefined;

  return (
    <WizardShell
      currentStep={descriptor?.step ?? null}
      formWidth={isWelcome ? 'wide' : 'default'}
      animationKey={location.pathname}
      {...(descriptor !== null ? { currentStepLabel: descriptor.label } : {})}
      {...(note !== undefined ? { note } : {})}
    >
      <Outlet />
    </WizardShell>
  );
}
