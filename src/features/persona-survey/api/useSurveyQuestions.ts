import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { onboardingKeys } from '@entities/onboarding/queryKeys';
import { apiResponseSurveyQuestionsSchema } from '@entities/onboarding/model';
import type { SurveyQuestion } from '@entities/onboarding/model';

async function fetchSurveyQuestions(): Promise<SurveyQuestion[]> {
  const response = await http.get('/api/persona/survey/questions', {
    params: { questionCount: 1 },
  });
  return apiResponseSurveyQuestionsSchema.parse(response.data).data;
}

export function useSurveyQuestions() {
  return useQuery({
    queryKey: onboardingKeys.surveyQuestions(),
    queryFn: fetchSurveyQuestions,
    staleTime: Infinity,
  });
}
