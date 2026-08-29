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

// 6축 스탯(domains/avatar §5.3) — 확정 사양은 5종이지만 wiki·온보딩 스키마와 함께 옮겨야 해 지금은 6축을 유지한다(spec-divergence #4).
export const AVATAR_STAT_KEYS = [
  'empathy',
  'proactivity',
  'humor',
  'sensitivity',
  'listening',
  'expressiveness',
] as const satisfies readonly string[];

export type AvatarStatKey = (typeof AVATAR_STAT_KEYS)[number];

// 서버 stats 는 double(0.0~100.0)이라 정수를 강제하면 72.5 같은 실제 값이 깨진다. 반올림은 표시 단계에서 한다.
const statValue = z.number().min(0).max(100);

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

// 호감도·턴 등 세션 이력은 프라이버시 사유로 노출하지 않는다.
export const avatarPublicInfoSchema = z.object({
  ageRange: z.string().min(1),
  region: z.string().min(1),
  job: z.string().min(1),
});
export type AvatarPublicInfo = z.infer<typeof avatarPublicInfoSchema>;

export const avatarDetailSchema = avatarBaseSchema.extend({
  type: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string().min(1)),
  stats: avatarStatsSchema,
  publicInfo: avatarPublicInfoSchema,
});
export type AvatarDetail = z.infer<typeof avatarDetailSchema>;

export const apiResponseAvatarDetail = z.object({ data: avatarDetailSchema });

/** 서버 AvatarSummaryResponse(GET .../summary, GET .../primary) — stats 는 PersonaStatType 키가 늘거나 바뀌어도 깨지지 않게 고정 키가 아닌 record 로 받는다(위 6축 avatarStatsSchema 와 다른 계열). */
export const avatarSummarySchema = z.object({
  schemaVersion: z.number().int(),
  avatarId: z.string().min(1),
  name: z.string().min(1),
  // 계약상 "저장된 값이 없으면 빈 문자열" 이라 min(1) 을 걸면 실응답이 떨어진다.
  description: z.string(),
  stats: z.record(z.string(), statValue),
});
export type AvatarSummary = z.infer<typeof avatarSummarySchema>;

export const apiResponseAvatarSummary = z.object({ data: avatarSummarySchema });
