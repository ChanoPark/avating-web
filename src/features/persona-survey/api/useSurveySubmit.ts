import { useMutation } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import type { AvatarCreateFromSurveyRequest } from '@entities/onboarding/model';

async function createAvatarFromSurvey(data: AvatarCreateFromSurveyRequest): Promise<void> {
  await http.post('/api/avatars/survey/', data);
}

export function useSurveySubmit() {
  return useMutation({
    mutationFn: createAvatarFromSurvey,
    throwOnError: false,
  });
}
