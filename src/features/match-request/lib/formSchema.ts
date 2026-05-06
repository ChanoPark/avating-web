import { z } from 'zod';
import { MATCH_REQUEST_GREETING_MAX } from '@entities/match-request';

// RHF resolver 전용 스키마. 엔티티의 sendMatchRequestSchema 와 분리되어 있는 이유:
//   - 폼은 partnerAvatarId 가 props 로 주입되고, 입력 시점에는 greeting 이 controlled
//     string ('') 으로 시작해야 RHF 의 register/watch 가 안정적으로 동작한다 → .default('').
//   - sendMatchRequestSchema 는 API 경계용이라 .strict() + trim → undefined 변환을 강제해
//     서버 페이로드 정규화를 책임진다 (useSendMatchRequest 의 mutationFn 에서 재파싱).
// 두 스키마는 GREETING_MAX 만 공유하고 나머지 책임은 분리된다.
export const matchRequestFormSchema = z.object({
  requesterAvatarId: z.string().min(1, '사용할 아바타를 선택해주세요'),
  greeting: z
    .string()
    .max(MATCH_REQUEST_GREETING_MAX, '첫 인사는 100자 이내로 작성해주세요')
    .optional()
    .default(''),
});

export type MatchRequestFormValues = z.input<typeof matchRequestFormSchema>;
