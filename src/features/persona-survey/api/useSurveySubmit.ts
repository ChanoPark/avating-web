import { useMutation } from '@tanstack/react-query';
import { apiResponseSurveySubmit } from '@entities/onboarding/model';
import type { SurveyResponse } from '@entities/onboarding/model';
import { http } from '@shared/api/http';

async function submitSurvey(data: SurveyResponse): Promise<{ avatarId: string }> {
  const response = await http.post('/api/onboarding/survey', data);
  const parsed = apiResponseSurveySubmit.parse(response.data);
  return parsed.data;
}

export function useSurveySubmit() {
  return useMutation({
    mutationFn: submitSurvey,
    throwOnError: false,
  });
}
