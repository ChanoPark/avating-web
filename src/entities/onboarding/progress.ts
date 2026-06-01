const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

export type OnboardingProgress = 'welcome' | 'intro' | 'method' | 'creating' | 'complete';
export type OnboardingMethod = 'survey' | 'connect';

// 와이어프레임 v2 단계 순서. welcome 은 진행바 없는 환영 모멘트(pre-step), intro 가 Step 1(이름·설명).
const ORDER: Record<OnboardingProgress, number> = {
  welcome: 0,
  intro: 1,
  method: 2,
  creating: 3,
  complete: 4,
};

function isValidProgress(val: string | null): val is OnboardingProgress {
  return (
    val === 'welcome' ||
    val === 'intro' ||
    val === 'method' ||
    val === 'creating' ||
    val === 'complete'
  );
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
    try {
      localStorage.setItem(PROGRESS_KEY, step);
    } catch {
      // Safari 프라이빗 모드 등 setItem 실패 — 베스트에포트 쓰기, 호출자에게 throw 전파 차단
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
    // Safari 프라이빗 모드 등 setItem 실패 — 베스트에포트 쓰기, 호출자에게 throw 전파 차단
  }
}
