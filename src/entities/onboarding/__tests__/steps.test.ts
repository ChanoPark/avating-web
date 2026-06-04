import { describe, it, expect } from 'vitest';
import { ONBOARDING_STEPS, ONBOARDING_TOTAL_STEPS } from '../steps';

describe('ONBOARDING_STEPS (와이어프레임 v2 단계 매핑)', () => {
  it('총 4단계다', () => {
    expect(ONBOARDING_TOTAL_STEPS).toBe(4);
  });

  it('intro 가 Step 1 (아바타 기본 정보) 이다', () => {
    expect(ONBOARDING_STEPS['/onboarding/intro']?.step).toBe(1);
  });

  it('method 가 Step 2 다', () => {
    expect(ONBOARDING_STEPS['/onboarding/method']?.step).toBe(2);
  });

  it('survey 와 connect 가 모두 Step 3 다', () => {
    expect(ONBOARDING_STEPS['/onboarding/survey']?.step).toBe(3);
    expect(ONBOARDING_STEPS['/onboarding/connect']?.step).toBe(3);
  });

  it('complete 가 Step 4 (아바타 확인) 다', () => {
    expect(ONBOARDING_STEPS['/onboarding/complete']?.step).toBe(4);
  });

  it('welcome 은 진행바 없는 pre-step 이라 단계 매핑에서 제외된다', () => {
    expect('/onboarding/welcome' in ONBOARDING_STEPS).toBe(false);
  });
});
