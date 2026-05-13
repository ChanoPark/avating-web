const KEY = 'avating:onboarding:progress';

export type OnboardingProgress = 'welcome' | 'method' | 'creating' | 'complete';

const ORDER: Record<OnboardingProgress, number> = {
  welcome: 0,
  method: 1,
  creating: 2,
  complete: 3,
};

function isValid(val: string | null): val is OnboardingProgress {
  return val === 'welcome' || val === 'method' || val === 'creating' || val === 'complete';
}

export function getOnboardingProgress(): OnboardingProgress {
  const val = localStorage.getItem(KEY);
  if (isValid(val)) return val;
  if (val === 'connect') return 'creating';
  return 'welcome';
}

export function setOnboardingProgress(step: OnboardingProgress): void {
  if (ORDER[step] > ORDER[getOnboardingProgress()]) {
    localStorage.setItem(KEY, step);
  }
}

export function clearOnboardingProgress(): void {
  localStorage.removeItem(KEY);
}
