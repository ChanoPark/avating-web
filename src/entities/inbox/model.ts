import { z } from 'zod';

export const inboxItemSchema = z.object({
  id: z.string().min(1),
  sender: z.object({
    initials: z.string().min(1).max(2),
    name: z.string().min(1),
  }),
  message: z.string().min(1),
  occurredAt: z.string().min(1),
  read: z.boolean(),
});
export type InboxItem = z.infer<typeof inboxItemSchema>;

export const inboxResponseSchema = z.object({
  items: z.array(inboxItemSchema),
  unreadCount: z.number().int().nonnegative(),
});
export type InboxResponse = z.infer<typeof inboxResponseSchema>;

export const apiResponseInbox = z.object({ data: inboxResponseSchema });
