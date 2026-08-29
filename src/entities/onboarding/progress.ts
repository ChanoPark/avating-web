const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

export type OnboardingProgress = 'welcome' | 'intro' | 'creating' | 'complete';
export type OnboardingMethod = 'survey' | 'connect';

// 와이어프레임 v2.6 단계 순서. welcome 은 진행바 없는 환영 모멘트(pre-step), intro 가 Step 1(이름·설명).
// 생성 방법 선택은 welcome 카드에 흡수돼 더 이상 진행 단계가 아니다.
const ORDER: Record<OnboardingProgress, number> = {
  welcome: 0,
  intro: 1,
  creating: 2,
  complete: 3,
};

function isValidProgress(val: string | null): val is OnboardingProgress {
  return val === 'welcome' || val === 'intro' || val === 'creating' || val === 'complete';
}

/**
 * 더 이상 쓰지 않는 진행 값 → 현재 값 매핑.
 * - `connect`: 'creating' 도입 전 Bot 경로가 쓰던 값.
 * - `method`: v2.6 에서 삭제된 생성 방법 선택 화면의 값. "intro 를 끝내고 방법을 고르던 중" 이었고
 *   그 시점에 METHOD_KEY 는 환영 화면에서 이미 채워지므로 creating 과 같은 자리다.
 */
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
      // Safari 프라이빗 모드 등 setItem 실패 — 마이그레이션 쓰기는 베스트에포트, 값 반환은 계속
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
