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
// 0–100 정수. 아바타 상세(S-03-03) 의 스탯바에서 사용.
// NOTE: 와이어프레임 v2 는 5종(적극성·공감·유머·깊이·속도)을 규정하지만 여기는 6축이다.
// 사용자가 5종 고정을 확정했으나 wiki domains/avatar §5.3 · 온보딩 스키마와 물려 있어
// 함께 옮겨야 한다 — 계획서의 spec-divergence #4 참조.
export const AVATAR_STAT_KEYS = [
  'empathy',
  'proactivity',
  'humor',
  'sensitivity',
  'listening',
  'expressiveness',
] as const satisfies readonly string[];

export type AvatarStatKey = (typeof AVATAR_STAT_KEYS)[number];

// 서버 AvatarSummaryResponse.stats 는 `type: number, format: double` (0.0~100.0) 이다.
// 정수를 강제하면 72.5 같은 실제 값이 파싱되지 않으므로 소수를 허용하고, 반올림은 표시 단계에서 한다.
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

// 공개 정보 — 상대 아바타 상세에서 노출 가능한 비식별 공개 필드 (나이대/지역/직군).
// 상대 아바타의 세션 이력(호감도·턴)은 프라이버시 사유로 노출에서 제거됨 (chat2/8/13).
export const avatarPublicInfoSchema = z.object({
  ageRange: z.string().min(1),
  region: z.string().min(1),
  job: z.string().min(1),
});
export type AvatarPublicInfo = z.infer<typeof avatarPublicInfoSchema>;

// Avatar Detail 응답 — `GET /api/avatars/:id` 본문. base 정보 + 설명 + 6축 stats + 태그/성향 + 공개 정보.
export const avatarDetailSchema = avatarBaseSchema.extend({
  type: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string().min(1)),
  stats: avatarStatsSchema,
  publicInfo: avatarPublicInfoSchema,
});
export type AvatarDetail = z.infer<typeof avatarDetailSchema>;

export const apiResponseAvatarDetail = z.object({ data: avatarDetailSchema });
