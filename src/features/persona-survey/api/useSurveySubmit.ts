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
  // defense-in-depth: RHF resolver 와 별개로 API 경계에서 한번 더 검증한다.
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
