import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { SURVEY_QUESTION_COUNT_PER_CATEGORY } from '@shared/config/constants';
import { onboardingKeys } from '@entities/onboarding/queryKeys';
import { apiResponseSurveyQuestionsSchema } from '@entities/onboarding/model';
import type { SurveyQuestion } from '@entities/onboarding/model';

async function fetchSurveyQuestions(): Promise<SurveyQuestion[]> {
  const response = await http.get('/api/persona/survey/questions', {
    params: { questionCount: SURVEY_QUESTION_COUNT_PER_CATEGORY },
  });
  return apiResponseSurveyQuestionsSchema.parse(response.data).data;
}

// useQuery 사용 (useSuspenseQuery 미선택) 이유:
//   useConnectStatus, usePublicKey 등 동일 레이어의 비-Suspense 훅과 패턴 일치를 우선.
//   설문 페이지는 라우트 경계 아래에서 자체 isLoading/isError 분기 + refetch CTA 로 처리.
export function useSurveyQuestions() {
  return useQuery({
    queryKey: onboardingKeys.surveyQuestions(),
    queryFn: fetchSurveyQuestions,
    staleTime: Infinity,
    retry: false,
  });
}
