import { z } from 'zod';
import {
  MATCH_REQUEST_GREETING_MAX,
  MATCH_REQUEST_ERROR_REQUESTER_EMPTY,
  MATCH_REQUEST_ERROR_GREETING_MAX,
} from '@entities/match-request';

// RHF resolver 전용 스키마. 엔티티의 sendMatchRequestSchema 와 분리되어 있는 이유:
//   - 폼은 partnerAvatarId 가 props 로 주입되어 폼 입력 대상 외이고, controlled 초기값은
//     useForm 의 defaultValues 가 책임진다.
//   - sendMatchRequestSchema 는 API 경계용이라 .strict() + trim → undefined 변환을 강제해
//     서버 페이로드 정규화를 책임진다 (useSendMatchRequest 의 mutationFn 에서 재파싱).
// 검증 상수·메시지는 entity 레이어 단일 출처 (constants.ts) 를 import.
export const matchRequestFormSchema = z.object({
  requesterAvatarId: z.string().min(1, MATCH_REQUEST_ERROR_REQUESTER_EMPTY),
  greeting: z.string().max(MATCH_REQUEST_GREETING_MAX, MATCH_REQUEST_ERROR_GREETING_MAX).optional(),
});

export type MatchRequestFormValues = z.input<typeof matchRequestFormSchema>;
