const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

export type OnboardingProgress = 'welcome' | 'intro' | 'creating' | 'complete';
export type OnboardingMethod = 'survey' | 'connect';

// 생성 방법은 welcome 카드에서 고른다 — 별도 단계가 아니다.
const ORDER: Record<OnboardingProgress, number> = {
  welcome: 0,
  intro: 1,
  creating: 2,
  complete: 3,
};

function isValidProgress(val: string | null): val is OnboardingProgress {
  return val === 'welcome' || val === 'intro' || val === 'creating' || val === 'complete';
}

// 레거시 진행값 마이그레이션: connect·method 는 모두 creating 으로 옮긴다 — 이 시점엔 METHOD_KEY 가 이미 채워져 있다.
const LEGACY_PROGRESS: Record<string, OnboardingProgress> = {
  connect: 'creating',
  method: 'creating',
};

function isValidMethod(val: string | null): val is OnboardingMethod {
  return val === 'survey' || val === 'connect';
}

export function getOnboardingProgress(): OnboardingProgress {
  const val = localStorage.getItem(PROGRESS_KEY);
  if (isValidProgress(val)) return val;
  const migrated = val !== null ? LEGACY_PROGRESS[val] : undefined;
  if (migrated !== undefined) {
    try {
      localStorage.setItem(PROGRESS_KEY, migrated);
    } catch {
      // setItem 실패해도(프라이빗 모드 등) 마이그레이션 값은 그대로 반환한다.
    }
    return migrated;
  }
  return 'welcome';
}

export function setOnboardingProgress(step: OnboardingProgress): void {
  if (ORDER[step] > ORDER[getOnboardingProgress()]) {
    try {
      localStorage.setItem(PROGRESS_KEY, step);
    } catch {
      /* empty */
    }
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
  try {
    localStorage.setItem(METHOD_KEY, method);
  } catch {
    /* empty */
  }
}
