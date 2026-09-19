import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseCreateSession, dashboardKeys } from '@entities/dashboard';
import type { CreateSessionResponse } from '@entities/dashboard';
import { avatarKeys } from '@entities/avatar';
import type { AvatarSimCandidateList } from '@entities/avatar';
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
    onSuccess: (_session, { avatarId }) => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      // 후보 목록은 랜덤 조회라 무효화해 다시 받으면 카드가 섞인다 — 요청한 후보만 서버 규칙
      // (진행 중 초대에 걸리면 요청 불가)대로 바꿔 같은 아바타에 중복 요청을 막는다.
      queryClient.setQueriesData<AvatarSimCandidateList>(
        { queryKey: avatarKeys.candidatesAll() },
        (list) =>
          list && {
            ...list,
            items: list.items.map((candidate) =>
              candidate.avatarId === avatarId
                ? { ...candidate, canRequestSimulation: false }
                : candidate
            ),
          }
      );
    },
    throwOnError: false,
  });
}
