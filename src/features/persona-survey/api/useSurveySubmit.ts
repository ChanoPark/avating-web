import { useMutation } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import {
  avatarCreateFromSurveyRequestSchema,
  type AvatarCreateFromSurveyRequest,
} from '@entities/onboarding/model';

async function createAvatarFromSurvey(data: AvatarCreateFromSurveyRequest): Promise<void> {
  const payload = avatarCreateFromSurveyRequestSchema.parse(data);
  await http.post('/api/avatars/survey/', payload);
}

export function useSurveySubmit() {
  return useMutation({
    mutationFn: createAvatarFromSurvey,
    throwOnError: false,
  });
}
