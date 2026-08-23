import { describe, it, expect } from 'vitest';
import { ONBOARDING_FALLBACK_LABELS, ONBOARDING_STEPS, ONBOARDING_TOTAL_STEPS } from '../steps';

describe('ONBOARDING_STEPS (와이어프레임 v2.6 단계 매핑)', () => {
  it('총 3단계다', () => {
    expect(ONBOARDING_TOTAL_STEPS).toBe(3);
  });

  it('레일 라벨도 3개다', () => {
    expect(ONBOARDING_FALLBACK_LABELS).toHaveLength(3);
  });

  it('intro 가 Step 1 (아바타 기본 정보) 이다', () => {
    expect(ONBOARDING_STEPS['/onboarding/intro']?.step).toBe(1);
  });

  it('survey 와 connect 가 모두 Step 2 다', () => {
    expect(ONBOARDING_STEPS['/onboarding/survey']?.step).toBe(2);
    expect(ONBOARDING_STEPS['/onboarding/connect']?.step).toBe(2);
  });

  it('complete 가 Step 3 (아바타 확인) 다', () => {
    expect(ONBOARDING_STEPS['/onboarding/complete']?.step).toBe(3);
  });

  it('welcome 은 진행바 없는 pre-step 이라 단계 매핑에서 제외된다', () => {
    expect('/onboarding/welcome' in ONBOARDING_STEPS).toBe(false);
  });

  // v2.6 에서 생성 방법 선택 화면이 삭제됐다 — 방법은 S-02-01 환영 카드에서만 고른다.
  it('생성 방법 선택은 더 이상 단계가 아니다', () => {
    expect('/onboarding/method' in ONBOARDING_STEPS).toBe(false);
    expect(ONBOARDING_FALLBACK_LABELS).not.toContain('생성 방법 선택');
  });
});
