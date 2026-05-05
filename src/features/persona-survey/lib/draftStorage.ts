import { surveyDraftSchema } from '@entities/onboarding/model';
import type { SurveyDraft } from '@entities/onboarding/model';

// 설문 draft 는 로컬 전용 전략. 서버 동기화(useSurveyDraft)는 백엔드 계약 v2 에서 제외됨 —
// 크로스 디바이스 복원 요구사항 없음, 24h TTL + 페이지 진입 시 단일 기기 복원으로 충분.
const KEY = 'avating:onboarding:survey-draft';
const TTL_MS = 24 * 60 * 60 * 1000;

type StoredDraft = {
  savedAt: string;
  value: SurveyDraft;
};

export function saveDraft(data: SurveyDraft): void {
  try {
    const stored: StoredDraft = {
      savedAt: new Date().toISOString(),
      value: data,
    };
    localStorage.setItem(KEY, JSON.stringify(stored));
    /* v8 ignore next 2 */
  } catch {
    // QuotaExceededError / SecurityError (Safari private mode) — skip silently
  }
}

export function loadDraft(): SurveyDraft | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const obj = parsed as Partial<StoredDraft>;
    if (typeof obj.savedAt !== 'string' || obj.value == null) return null;

    const savedAtMs = new Date(obj.savedAt).getTime();
    if (isNaN(savedAtMs)) return null;

    if (Date.now() - savedAtMs > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }

    const validated = surveyDraftSchema.safeParse(obj.value);
    if (!validated.success) {
      localStorage.removeItem(KEY);
      return null;
    }
    return validated.data;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(KEY);
}
