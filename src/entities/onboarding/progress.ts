const KEY = 'avating:onboarding:progress';

type OnboardingProgress = 'welcome' | 'connect' | 'complete';

const ORDER: Record<OnboardingProgress, number> = { welcome: 0, connect: 1, complete: 2 };

export function getOnboardingProgress(): OnboardingProgress {
  const val = localStorage.getItem(KEY);
  if (val === 'connect' || val === 'complete') return val;
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
