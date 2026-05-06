import { z } from 'zod';

export const matchRequestFormSchema = z.object({
  requesterAvatarId: z.string().min(1, '사용할 아바타를 선택해주세요'),
  greeting: z.string().max(100, '첫 인사는 100자 이내로 작성해주세요').optional().default(''),
});

export type MatchRequestFormValues = z.input<typeof matchRequestFormSchema>;
