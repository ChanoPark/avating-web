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

// 6축 스탯 — domains/avatar §5.3 (handover) 와 generatedAvatarStatsSchema (onboarding) 와 정합.
// 0–100 정수. 와이어프레임 Avatar Detail (ScreenAvatarDetail) 의 HexRadar + ProgressBar 행에서 사용.
export const AVATAR_STAT_KEYS = [
  'empathy',
  'proactivity',
  'humor',
  'sensitivity',
  'listening',
  'expressiveness',
] as const satisfies readonly string[];

export type AvatarStatKey = (typeof AVATAR_STAT_KEYS)[number];

const statValue = z.number().int().min(0).max(100);

export const avatarStatsSchema = z.object({
  empathy: statValue,
  proactivity: statValue,
  humor: statValue,
  sensitivity: statValue,
  listening: statValue,
  expressiveness: statValue,
});
export type AvatarStats = z.infer<typeof avatarStatsSchema>;

export const AVATAR_STAT_LABELS: Record<AvatarStatKey, { short: string; long: string }> = {
  empathy: { short: '공감', long: '공감 지수' },
  proactivity: { short: '적극', long: '적극성' },
  humor: { short: '유머', long: '유머' },
  sensitivity: { short: '감성', long: '감성' },
  listening: { short: '경청', long: '경청' },
  expressiveness: { short: '표현', long: '표현력' },
};

// 세션 이력 row — 와이어 라인 947-958. result 는 wiki/domains/matching 의 종료 조건 3종 정합.
export const avatarSessionHistoryResultSchema = z.enum(['matched', 'ended', 'aborted']);
export type AvatarSessionHistoryResult = z.infer<typeof avatarSessionHistoryResultSchema>;

export const avatarSessionHistoryItemSchema = z.object({
  id: z.string().min(1),
  turn: z.number().int().min(0),
  totalTurns: z.number().int().min(1),
  affinity: z.number().int().min(0).max(100),
  result: avatarSessionHistoryResultSchema,
  endedAt: z.string().min(1),
});
export type AvatarSessionHistoryItem = z.infer<typeof avatarSessionHistoryItemSchema>;

// Avatar Detail 응답 — `GET /api/avatars/:id` 본문. base 정보 + 6축 stats + 태그/성향 + 최근 세션 이력 inline.
// inline 채택 사유: 본 phase 에서 entities/session 신규 박제 회피 (handover §2.5 결정).
export const avatarDetailSchema = avatarBaseSchema.extend({
  type: z.string().min(1),
  tags: z.array(z.string().min(1)),
  stats: avatarStatsSchema,
  sessionHistory: z.array(avatarSessionHistoryItemSchema),
});
export type AvatarDetail = z.infer<typeof avatarDetailSchema>;

export const apiResponseAvatarDetail = z.object({ data: avatarDetailSchema });
