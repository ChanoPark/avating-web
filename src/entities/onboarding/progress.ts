const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

export type OnboardingProgress = 'welcome' | 'method' | 'creating' | 'complete';
export type OnboardingMethod = 'survey' | 'connect';

const ORDER: Record<OnboardingProgress, number> = {
  welcome: 0,
  method: 1,
  creating: 2,
  complete: 3,
};

function isValidProgress(val: string | null): val is OnboardingProgress {
  return val === 'welcome' || val === 'method' || val === 'creating' || val === 'complete';
}

function isValidMethod(val: string | null): val is OnboardingMethod {
  return val === 'survey' || val === 'connect';
}

export function getOnboardingProgress(): OnboardingProgress {
  const val = localStorage.getItem(PROGRESS_KEY);
  if (isValidProgress(val)) return val;
  if (val === 'connect') {
    try {
      localStorage.setItem(PROGRESS_KEY, 'creating');
    } catch {
      // Safari 프라이빗 모드 등 setItem 실패 — 마이그레이션 쓰기는 베스트에포트, 값 반환은 계속
    }
    return 'creating';
  }
  return 'welcome';
}

export function setOnboardingProgress(step: OnboardingProgress): void {
  if (ORDER[step] > ORDER[getOnboardingProgress()]) {
    localStorage.setItem(PROGRESS_KEY, step);
  }
}

export function clearOnboardingProgress(): void {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(METHOD_KEY);
}

export function getOnboardingMethod(): OnboardingMethod | null {
  const val = localStorage.getItem(METHOD_KEY);
  return isValidMethod(val) ? val : null;
}

export function setOnboardingMethod(method: OnboardingMethod): void {
  localStorage.setItem(METHOD_KEY, method);
}
