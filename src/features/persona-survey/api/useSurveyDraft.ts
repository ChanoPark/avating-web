import { useMutation } from '@tanstack/react-query';
import { apiResponseSurveyDraft } from '@entities/onboarding/model';
import type { SurveyDraft } from '@entities/onboarding/model';
import { http } from '@shared/api/http';

async function saveSurveyDraft(data: Partial<SurveyDraft>): Promise<{ savedAt: string }> {
  const response = await http.patch('/api/onboarding/survey/draft', data);
  const parsed = apiResponseSurveyDraft.parse(response.data);
  return parsed.data;
}

export function useSurveyDraft() {
  return useMutation({
    mutationFn: saveSurveyDraft,
    throwOnError: false,
  });
}
