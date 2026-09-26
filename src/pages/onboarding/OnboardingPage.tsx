import { Outlet, useLocation } from 'react-router';
import { ONBOARDING_STEPS, type OnboardingRoute } from '@entities/onboarding';
import { WizardShell, type FormWidth } from './ui/WizardShell';

function isOnboardingRoute(pathname: string): pathname is OnboardingRoute {
  return pathname in ONBOARDING_STEPS;
}

const RAIL_NOTES: Partial<Record<OnboardingRoute, string>> = {
  // intro 의 정본 각주("나중에 프로필에서 수정")는 사용자 결정(2026-09-25)으로 두지 않는다.
  '/onboarding/connect': '약 10분 소요 · 대화가 길수록 아바타가 정확해져요.',
  // 스탯 튜닝(스탯 다듬기) UI 는 2026-08-30 서버 7지표 전환으로 제거돼 안내도 확인 문구로 교체.
  '/onboarding/complete': '생성된 아바타를 확인한 뒤 완료를 눌러주세요.',
};

const WELCOME_ROUTE = '/onboarding/welcome';
const SURVEY_ROUTE = '/onboarding/survey';

function formWidthOf(pathname: string): FormWidth {
  if (pathname === WELCOME_ROUTE) return 'wide';
  if (pathname === SURVEY_ROUTE) return 'survey';
  return 'default';
}

const WELCOME_NOTE = '어느 방법을 골라도 아래 3단계를 거쳐요 · 방법은 여기서만 고를 수 있어요';

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
      formWidth={formWidthOf(location.pathname)}
      animationKey={location.pathname}
      {...(descriptor !== null ? { currentStepLabel: descriptor.label } : {})}
      {...(note !== undefined ? { note } : {})}
    >
      <Outlet />
    </WizardShell>
  );
}
