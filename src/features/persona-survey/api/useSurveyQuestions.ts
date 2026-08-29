import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { SURVEY_QUESTION_COUNT_PER_CATEGORY } from '@shared/config/constants';
import { onboardingKeys } from '@entities/onboarding/queryKeys';
import { apiResponseSurveyQuestionsSchema } from '@entities/onboarding/model';
import type { SurveyQuestion } from '@entities/onboarding/model';

type UseSurveyQuestionsOptions = {
  enabled?: boolean;
};

async function fetchSurveyQuestions(): Promise<SurveyQuestion[]> {
  const response = await http.get('/api/persona/survey/questions', {
    params: { questionCount: SURVEY_QUESTION_COUNT_PER_CATEGORY },
  });
  return apiResponseSurveyQuestionsSchema.parse(response.data).data;
}

// useSuspenseQuery 대신 useQuery — 이 화면은 자체 isLoading/isError 분기 + refetch CTA 로 처리한다.
export function useSurveyQuestions(options: UseSurveyQuestionsOptions = {}) {
  return useQuery({
    queryKey: onboardingKeys.surveyQuestions(),
    queryFn: fetchSurveyQuestions,
    staleTime: Infinity,
    retry: false,
    enabled: options.enabled ?? true,
  });
}
