import { z } from 'zod';
import { avatarBaseSchema } from '@entities/avatar/model';
import {
  MATCH_REQUEST_GREETING_MAX,
  MATCH_REQUEST_ERROR_REQUESTER_EMPTY,
  MATCH_REQUEST_ERROR_GREETING_MAX,
} from './constants';

export const matchRequestStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'expired']);
export type MatchRequestStatus = z.infer<typeof matchRequestStatusSchema>;

export const matchRequestSchema = z.object({
  id: z.string().min(1),
  requesterUserId: z.string().min(1),
  requesterAvatarId: z.string().min(1),
  partnerUserId: z.string().min(1),
  partnerAvatarId: z.string().min(1),
  greeting: z.string().nullable(),
  status: matchRequestStatusSchema,
  rejectionReason: z.string().nullable(),
  createdAt: z.string(),
  respondedAt: z.string().nullable(),
  expiresAt: z.string(),
});
export type MatchRequest = z.infer<typeof matchRequestSchema>;

export const sendMatchRequestSchema = z
  .object({
    partnerAvatarId: z.string().min(1, '상대 아바타가 지정되지 않았어요'),
    requesterAvatarId: z.string().min(1, MATCH_REQUEST_ERROR_REQUESTER_EMPTY),
    greeting: z
      .string()
      .max(MATCH_REQUEST_GREETING_MAX, MATCH_REQUEST_ERROR_GREETING_MAX)
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      }),
  })
  .strict();
export type SendMatchRequestInput = z.infer<typeof sendMatchRequestSchema>;

export const apiResponseMatchRequest = z.object({ data: matchRequestSchema });

export const myAvatarSchema = avatarBaseSchema.extend({
  type: z.string().min(1),
  isPrimary: z.boolean(),
  busy: z.boolean(),
});
export type MyAvatar = z.infer<typeof myAvatarSchema>;

export const myAvatarsResponseSchema = z.object({ items: z.array(myAvatarSchema) });
export const apiResponseMyAvatars = z.object({ data: myAvatarsResponseSchema });
export type MyAvatarsResponse = z.infer<typeof myAvatarsResponseSchema>;
