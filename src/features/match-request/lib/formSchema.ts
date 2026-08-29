import { z } from 'zod';
import {
  MATCH_REQUEST_GREETING_MAX,
  MATCH_REQUEST_ERROR_REQUESTER_EMPTY,
  MATCH_REQUEST_ERROR_GREETING_MAX,
} from '@entities/match-request';

// RHF resolver 전용 스키마 — 엔티티의 sendMatchRequestSchema(API 경계, 페이로드 정규화 책임)와는
// 의도적으로 분리한다. 병합하지 않는다.
export const matchRequestFormSchema = z.object({
  requesterAvatarId: z.string().min(1, MATCH_REQUEST_ERROR_REQUESTER_EMPTY),
  greeting: z.string().max(MATCH_REQUEST_GREETING_MAX, MATCH_REQUEST_ERROR_GREETING_MAX).optional(),
});

export type MatchRequestFormValues = z.input<typeof matchRequestFormSchema>;
