import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getOnboardingProgress,
  setOnboardingProgress,
  clearOnboardingProgress,
  getOnboardingMethod,
  setOnboardingMethod,
} from '../progress';

const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

describe('getOnboardingProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('값이 없으면 welcome 을 반환한다', () => {
    expect(getOnboardingProgress()).toBe('welcome');
  });

  it('유효한 값(method/creating/complete)을 그대로 반환한다', () => {
    localStorage.setItem(PROGRESS_KEY, 'method');
    expect(getOnboardingProgress()).toBe('method');
    localStorage.setItem(PROGRESS_KEY, 'creating');
    expect(getOnboardingProgress()).toBe('creating');
    localStorage.setItem(PROGRESS_KEY, 'complete');
    expect(getOnboardingProgress()).toBe('complete');
  });

  it('레거시 "connect" 값을 발견하면 "creating" 으로 즉시 마이그레이션한다 (read-side write)', () => {
    localStorage.setItem(PROGRESS_KEY, 'connect');
    const result = getOnboardingProgress();
    expect(result).toBe('creating');
    expect(localStorage.getItem(PROGRESS_KEY)).toBe('creating');
  });

  it('레거시 "connect" + setItem 실패 환경에서도 crash 없이 "creating" 을 반환한다 (Safari 프라이빗 모드 방어)', () => {
    localStorage.setItem(PROGRESS_KEY, 'connect');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => getOnboardingProgress()).not.toThrow();
    expect(getOnboardingProgress()).toBe('creating');
    setItemSpy.mockRestore();
  });

  it('알 수 없는 값은 welcome 으로 fallback', () => {
    localStorage.setItem(PROGRESS_KEY, 'garbage');
    expect(getOnboardingProgress()).toBe('welcome');
  });
});

describe('setOnboardingProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('현재 단계보다 앞으로만 진행한다 (역방향 무시)', () => {
    setOnboardingProgress('method');
    setOnboardingProgress('welcome');
    expect(getOnboardingProgress()).toBe('method');
  });

  it('동일 단계 재설정은 무시된다', () => {
    setOnboardingProgress('creating');
    setOnboardingProgress('creating');
    expect(getOnboardingProgress()).toBe('creating');
  });

  it('순방향 진행이 정상 동작한다', () => {
    setOnboardingProgress('method');
    setOnboardingProgress('creating');
    setOnboardingProgress('complete');
    expect(getOnboardingProgress()).toBe('complete');
  });
});

describe('clearOnboardingProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('PROGRESS_KEY 와 METHOD_KEY 를 모두 삭제한다', () => {
    setOnboardingProgress('creating');
    setOnboardingMethod('connect');
    expect(localStorage.getItem(PROGRESS_KEY)).not.toBeNull();
    expect(localStorage.getItem(METHOD_KEY)).not.toBeNull();

    clearOnboardingProgress();

    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
    expect(localStorage.getItem(METHOD_KEY)).toBeNull();
  });
});

describe('getOnboardingMethod / setOnboardingMethod', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('값이 없으면 null 을 반환한다', () => {
    expect(getOnboardingMethod()).toBeNull();
  });

  it('survey / connect 값을 그대로 반환한다', () => {
    setOnboardingMethod('survey');
    expect(getOnboardingMethod()).toBe('survey');
    setOnboardingMethod('connect');
    expect(getOnboardingMethod()).toBe('connect');
  });

  it('알 수 없는 값은 null 로 처리한다', () => {
    localStorage.setItem(METHOD_KEY, 'garbage');
    expect(getOnboardingMethod()).toBeNull();
  });
});
