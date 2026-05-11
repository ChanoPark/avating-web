import { useMutation } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import {
  avatarCreateFromSurveyRequestSchema,
  avatarCreateFromSurveyResponseSchema,
  type AvatarCreateFromSurveyRequest,
  type AvatarCreateFromSurveyResponse,
} from '@entities/onboarding/model';

async function createAvatarFromSurvey(
  data: AvatarCreateFromSurveyRequest
): Promise<AvatarCreateFromSurveyResponse> {
  // RHF resolver 와 독립적인 API 경계 검증 — 훅 직접 호출(테스트·외부 호출자) 시에도
  // 잘못된 페이로드가 네트워크 단계로 새는 것을 차단.
  const payload = avatarCreateFromSurveyRequestSchema.parse(data);
  const response = await http.post('/api/avatars/survey', payload);
  return avatarCreateFromSurveyResponseSchema.parse(response.data).data;
}

export function useSurveySubmit() {
  return useMutation({
    mutationFn: createAvatarFromSurvey,
    throwOnError: false,
  });
}
