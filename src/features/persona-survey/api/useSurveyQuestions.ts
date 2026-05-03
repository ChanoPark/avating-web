import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { onboardingKeys } from '@entities/onboarding/queryKeys';
import { apiResponseSurveyQuestionsSchema } from '@entities/onboarding/model';
import type { SurveyQuestion } from '@entities/onboarding/model';

const SURVEY_QUESTION_COUNT = 1;

async function fetchSurveyQuestions(): Promise<SurveyQuestion[]> {
  const response = await http.get('/api/persona/survey/questions', {
    params: { questionCount: SURVEY_QUESTION_COUNT },
  });
  return apiResponseSurveyQuestionsSchema.parse(response.data).data;
}

export function useSurveyQuestions() {
  return useQuery({
    queryKey: onboardingKeys.surveyQuestions(),
    queryFn: fetchSurveyQuestions,
    staleTime: Infinity,
    retry: false,
  });
}
