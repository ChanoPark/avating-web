import { z } from 'zod';

export const avatarStatusSchema = z.enum(['online', 'busy', 'offline']);
export type AvatarStatus = z.infer<typeof avatarStatusSchema>;

export const avatarBaseSchema = z.object({
  id: z.string().min(1),
  initials: z.string().min(1).max(2),
  name: z.string().min(1),
  handle: z.string().min(1),
  level: z.number().int().min(1),
  status: avatarStatusSchema,
  verified: z.boolean(),
});
export type AvatarBase = z.infer<typeof avatarBaseSchema>;
