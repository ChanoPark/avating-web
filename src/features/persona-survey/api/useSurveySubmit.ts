import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { avatarKeys, apiResponseAvatarSummary } from '@entities/avatar';
import type { AvatarSummary } from '@entities/avatar';
import {
  avatarCreateFromSurveyRequestSchema,
  type AvatarCreateFromSurveyRequest,
} from '@entities/onboarding/model';

async function createAvatarFromSurvey(data: AvatarCreateFromSurveyRequest): Promise<AvatarSummary> {
  // defense-in-depth: RHF resolver 와 별개로 API 경계에서 한번 더 검증한다.
  const payload = avatarCreateFromSurveyRequestSchema.parse(data);
  const response = await http.post('/api/avatars/survey', payload);
  return apiResponseAvatarSummary.parse(response.data).data;
}

export function useSurveySubmit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAvatarFromSurvey,
    onSuccess: (summary) => {
      // 완료 화면이 별도 조회 없이 생성 응답을 그대로 쓰도록 대표 아바타 캐시에 심는다.
      // 같은 키를 온보딩 완료 판정(useOnboardingCompletion)도 읽으므로 가드도 즉시 통과한다.
      queryClient.setQueryData<AvatarSummary | null>(avatarKeys.primary(), summary);
    },
    throwOnError: false,
  });
}
