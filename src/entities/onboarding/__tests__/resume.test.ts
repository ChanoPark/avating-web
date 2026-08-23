import { describe, it, expect, beforeEach } from 'vitest';
import { resolveResumeRoute } from '../resume';

const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

describe('resolveResumeRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('아바타가 없으면 — 온보딩 미완료', () => {
    it('진행 기록이 없으면 첫 입력 단계로 보낸다', () => {
      expect(resolveResumeRoute(false)).toBe('/onboarding/intro');
    });

    it('welcome 은 pre-step 이라 intro 부터 시작한다', () => {
      localStorage.setItem(PROGRESS_KEY, 'welcome');
      expect(resolveResumeRoute(false)).toBe('/onboarding/intro');
    });

    it('intro 까지 진행했으면 intro 를 이어서 연다', () => {
      localStorage.setItem(PROGRESS_KEY, 'intro');
      expect(resolveResumeRoute(false)).toBe('/onboarding/intro');
    });

    // v2.6: 방법 선택 화면이 사라져 레거시 'method' 는 creating 으로 마이그레이션된다.
    // 그 시점에 METHOD_KEY 는 환영 화면에서 이미 채워져 있으므로 고른 방법의 화면으로 이어진다.
    it('레거시 method 기록은 고른 방법의 화면으로 이어진다', () => {
      localStorage.setItem(PROGRESS_KEY, 'method');
      localStorage.setItem(METHOD_KEY, 'connect');
      expect(resolveResumeRoute(false)).toBe('/onboarding/connect');
    });

    it('creating 은 선택한 방법의 화면으로 이어진다 — 설문', () => {
      localStorage.setItem(PROGRESS_KEY, 'creating');
      localStorage.setItem(METHOD_KEY, 'survey');
      expect(resolveResumeRoute(false)).toBe('/onboarding/survey');
    });

    it('creating 은 선택한 방법의 화면으로 이어진다 — Bot 연동', () => {
      localStorage.setItem(PROGRESS_KEY, 'creating');
      localStorage.setItem(METHOD_KEY, 'connect');
      expect(resolveResumeRoute(false)).toBe('/onboarding/connect');
    });

    it('creating 인데 방법 기록이 없으면 환영 화면으로 되돌린다', () => {
      localStorage.setItem(PROGRESS_KEY, 'creating');
      expect(resolveResumeRoute(false)).toBe('/onboarding/welcome');
    });

    // 진행 기록의 complete 는 "아바타가 생겼다" 를 보장하지 않는다.
    // (ConnectStep 의 '생성된 결과 확인' 처럼 아바타 없이도 올라가던 값이다)
    // 아바타가 없으면 완료로 인정하지 않고 생성 단계로 되돌린다.
    it('complete 기록이 있어도 아바타가 없으면 생성 단계로 되돌린다', () => {
      localStorage.setItem(PROGRESS_KEY, 'complete');
      localStorage.setItem(METHOD_KEY, 'survey');
      expect(resolveResumeRoute(false)).toBe('/onboarding/survey');
    });

    it('complete 기록만 있고 방법 기록이 없으면 환영 화면으로 되돌린다', () => {
      localStorage.setItem(PROGRESS_KEY, 'complete');
      expect(resolveResumeRoute(false)).toBe('/onboarding/welcome');
    });
  });

  describe('아바타가 있으면 — 온보딩 완료', () => {
    it('진행 기록과 무관하게 확인 화면으로 보낸다', () => {
      expect(resolveResumeRoute(true)).toBe('/onboarding/complete');

      localStorage.setItem(PROGRESS_KEY, 'intro');
      expect(resolveResumeRoute(true)).toBe('/onboarding/complete');

      localStorage.setItem(PROGRESS_KEY, 'complete');
      expect(resolveResumeRoute(true)).toBe('/onboarding/complete');
    });
  });
});
