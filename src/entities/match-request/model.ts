import { z } from 'zod';
import { avatarColorSchema } from '@entities/avatar';
import {
  MATCH_REQUEST_GREETING_MAX,
  MATCH_REQUEST_ERROR_REQUESTER_EMPTY,
  MATCH_REQUEST_ERROR_GREETING_MAX,
} from './constants';

export const invitationStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'REJECTED',
  'CANCELED',
  'ABORTED',
  'EXPIRED',
  'DONE',
]);

const createInvitationResponseSchema = z.object({
  simulationInvitationId: z.string().min(1),
  inviterAvatarName: z.string().min(1),
  inviterAvatarHashtag: z.string().min(1),
  inviteeAvatarName: z.string().min(1),
  inviteeAvatarHashtag: z.string().min(1),
  status: invitationStatusSchema,
  expiredAt: z.string().datetime({ offset: true }),
});
export type CreatedInvitation = z.infer<typeof createInvitationResponseSchema>;

const invitationDirectionSchema = z.enum(['SENT', 'RECEIVED']);

const invitationHistoryItemSchema = z.object({
  simulationInvitationId: z.string().min(1),
  inviterAvatarId: z.string().min(1),
  inviterAvatarName: z.string().min(1),
  inviterAvatarHashtag: z.string().min(1).optional(),
  inviterAvatarColor: avatarColorSchema.optional(),
  inviteeAvatarId: z.string().min(1),
  inviteeAvatarName: z.string().min(1),
  inviteeAvatarHashtag: z.string().min(1).optional(),
  inviteeAvatarColor: avatarColorSchema.optional(),
  status: invitationStatusSchema,
  direction: invitationDirectionSchema,
  requestMessage: z.string().optional(),
  rejectMessage: z.string().optional(),
  expiredAt: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
});
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
export type InvitationDirection = z.infer<typeof invitationDirectionSchema>;
export type InvitationHistoryItem = z.infer<typeof invitationHistoryItemSchema>;

const invitationHistoryPageSchema = z.object({
  content: z.array(invitationHistoryItemSchema),
  nextCursor: z.string().optional(),
  hasNext: z.boolean(),
});
export type InvitationHistoryPage = z.infer<typeof invitationHistoryPageSchema>;

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

export const apiResponseCreateInvitation = z.object({ data: createInvitationResponseSchema });
export const apiResponseInvitationHistoryPage = z.object({ data: invitationHistoryPageSchema });
