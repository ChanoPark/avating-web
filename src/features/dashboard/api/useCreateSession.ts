import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseCreateSession, dashboardKeys } from '@entities/dashboard';
import type { CreateSessionResponse } from '@entities/dashboard';
import type { ApiError } from '@shared/lib/errors';

type CreateSessionInput = { avatarId: string };

async function createSession(input: CreateSessionInput): Promise<CreateSessionResponse> {
  const response = await http.post('/api/sessions', input);
  const parsed = apiResponseCreateSession.parse(response.data);
  return parsed.data;
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation<CreateSessionResponse, ApiError, CreateSessionInput>({
    mutationFn: createSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    throwOnError: false,
  });
}
