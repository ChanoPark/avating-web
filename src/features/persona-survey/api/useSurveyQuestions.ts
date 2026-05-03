import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { onboardingKeys } from '@entities/onboarding/queryKeys';
import { apiResponseSurveyQuestionsSchema } from '@entities/onboarding/model';
import type { SurveyQuestion } from '@entities/onboarding/model';

// 백엔드 questionCount 의미: 카테고리당 질문 수(N)이며 응답에 N×카테고리 만큼 질문이 반환된다.
// 모킹 시나리오는 2 카테고리 × 1 → 2 질문을 반환한다.
const SURVEY_QUESTION_COUNT_PER_CATEGORY = 1;

async function fetchSurveyQuestions(): Promise<SurveyQuestion[]> {
  const response = await http.get('/api/persona/survey/questions', {
    params: { questionCount: SURVEY_QUESTION_COUNT_PER_CATEGORY },
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
