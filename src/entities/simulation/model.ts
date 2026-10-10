import { z } from 'zod';

const turnSchema = z.object({
  index: z.number().int().nonnegative(),
  speakerAvatarId: z.string().min(1),
  content: z.string(),
  createdAt: z.string().datetime({ offset: true }),
});
export type Turn = z.infer<typeof turnSchema>;

export const sessionTurnsSchema = z.object({
  sessionId: z.string().min(1),
  turns: z.array(turnSchema),
  completed: z.boolean(),
});
export type SessionTurns = z.infer<typeof sessionTurnsSchema>;

const turnIndexSchema = z.number().int().nonnegative();

const turnEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('turn_started'),
    turnIndex: turnIndexSchema,
    speakerAvatarId: z.string().min(1),
  }),
  z.object({
    type: z.literal('delta'),
    turnIndex: turnIndexSchema,
    seq: z.number().int().nonnegative(),
    text: z.string(),
  }),
  z.object({
    type: z.literal('turn_completed'),
    turnIndex: turnIndexSchema,
    speakerAvatarId: z.string().min(1),
    content: z.string(),
  }),
  z.object({
    type: z.literal('turn_failed'),
    turnIndex: turnIndexSchema,
    reason: z.string().optional(),
  }),
  z.object({
    type: z.literal('session_completed'),
    lastTurnIndex: z.number().int(),
  }),
]);
export type TurnEvent = z.infer<typeof turnEventSchema>;

const KNOWN_EVENT_TYPES: readonly string[] = turnEventSchema.options.map(
  (option) => option.shape.type.value
);

export function parseTurnEvent(data: string): TurnEvent | null {
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    console.warn('[simulation] SSE data 가 JSON 이 아니다');
    return null;
  }

  const parsed = turnEventSchema.safeParse(json);
  if (parsed.success) return parsed.data;

  const type = (json as { type?: unknown } | null)?.type;
  if (typeof type === 'string' && KNOWN_EVENT_TYPES.includes(type)) {
    console.warn(`[simulation] ${type} 이벤트의 모양이 계약과 다르다`, parsed.error.issues);
  }
  return null;
}
