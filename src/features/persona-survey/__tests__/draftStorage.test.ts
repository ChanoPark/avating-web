import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { saveDraft, loadDraft, clearDraft } from '../lib/draftStorage';

const DRAFT_KEY = 'avating:onboarding:survey-draft';

describe('draftStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveDraft + loadDraft', () => {
    it('saveDraft 후 loadDraft 가 동일한 객체를 반환한다', () => {
      const draft = { q1: 'solo' as const, q2: 'wait' as const };
      saveDraft(draft);

      const loaded = loadDraft();
      expect(loaded).toEqual(draft);
    });

    it('빈 draft 를 저장하고 로드할 수 있다', () => {
      saveDraft({});

      const loaded = loadDraft();
      expect(loaded).toEqual({});
    });

    it('여러 필드를 가진 draft 를 저장하고 로드할 수 있다', () => {
      const draft = {
        q1: 'few' as const,
        q2: 'signal' as const,
        q3: 'culture' as const,
        q4: 'detailed' as const,
      };
      saveDraft(draft);

      const loaded = loadDraft();
      expect(loaded).toEqual(draft);
    });

    it('saveDraft 는 localStorage 에 savedAt 을 포함해 저장한다', () => {
      const now = new Date('2026-05-01T10:00:00.000Z').getTime();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      saveDraft({ q1: 'solo' as const });

      const raw = localStorage.getItem(DRAFT_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveProperty('savedAt');
      expect(parsed).toHaveProperty('value');

      vi.useRealTimers();
    });
  });

  describe('loadDraft — TTL 만료', () => {
    it('savedAt 이 24h 초과이면 loadDraft 가 null 을 반환한다', () => {
      const now = new Date('2026-05-01T10:00:00.000Z').getTime();
      const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;

      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          savedAt: new Date(twentyFiveHoursAgo).toISOString(),
          value: { q1: 'solo' },
        })
      );

      vi.useFakeTimers();
      vi.setSystemTime(now);

      const loaded = loadDraft();
      expect(loaded).toBeNull();

      vi.useRealTimers();
    });

    it('savedAt 이 24h 초과이면 localStorage 키가 삭제된다', () => {
      const now = new Date('2026-05-01T10:00:00.000Z').getTime();
      const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;

      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          savedAt: new Date(twentyFiveHoursAgo).toISOString(),
          value: { q1: 'solo' },
        })
      );

      vi.useFakeTimers();
      vi.setSystemTime(now);

      loadDraft();

      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();

      vi.useRealTimers();
    });

    it('savedAt 이 24h 이내이면 loadDraft 가 값을 반환한다', () => {
      const now = new Date('2026-05-01T10:00:00.000Z').getTime();
      const twentyThreeHoursAgo = now - 23 * 60 * 60 * 1000;

      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          savedAt: new Date(twentyThreeHoursAgo).toISOString(),
          value: { q1: 'solo' },
        })
      );

      vi.useFakeTimers();
      vi.setSystemTime(now);

      const loaded = loadDraft();
      expect(loaded).toEqual({ q1: 'solo' });

      vi.useRealTimers();
    });
  });

  describe('loadDraft — 손상된 데이터', () => {
    it('손상된 JSON 이 저장되어 있으면 null 을 반환한다 (throw 금지)', () => {
      localStorage.setItem(DRAFT_KEY, 'not-valid-json{{{');

      expect(() => loadDraft()).not.toThrow();
      expect(loadDraft()).toBeNull();
    });

    it('JSON 구조는 맞지만 savedAt 이 없으면 null 을 반환한다', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ value: { q1: 'solo' } }));

      const loaded = loadDraft();
      expect(loaded).toBeNull();
    });

    it('JSON 구조는 맞지만 value 가 없으면 null 을 반환한다', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: '2026-05-01T10:00:00.000Z' }));

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-01T10:30:00.000Z').getTime());

      const loaded = loadDraft();
      expect(loaded).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('clearDraft', () => {
    it('clearDraft 호출 후 loadDraft 가 null 을 반환한다', () => {
      saveDraft({ q1: 'solo' as const });
      clearDraft();

      expect(loadDraft()).toBeNull();
    });

    it('clearDraft 호출 후 localStorage 키가 삭제된다', () => {
      saveDraft({ q1: 'solo' as const });
      clearDraft();

      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    });
  });
});
