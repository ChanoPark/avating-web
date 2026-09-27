import { z } from 'zod';

export const avatarStatusSchema = z.enum(['online', 'busy', 'offline']);

export const avatarBaseSchema = z.object({
  id: z.string().min(1),
  initials: z.string().min(1).max(2),
  name: z.string().min(1),
  level: z.number().int().min(1),
  status: avatarStatusSchema,
  verified: z.boolean(),
});

// 서버 stats 는 double(0.0~100.0)이라 정수를 강제하면 72.5 같은 실제 값이 깨진다. 반올림은 표시 단계에서 한다.
const statValue = z.number().min(0).max(100);

// 서버 Avatar.color — `#` 없는 6자리 hex(AvatarColor.PATTERN). 서버가 대문자로 정규화해 저장한다.
export const avatarColorSchema = z.string().regex(/^[0-9A-Fa-f]{6}$/);

/** 서버 AvatarSummaryResponse(POST /avatars/survey, GET .../summary, GET .../primary) — stats 는 PersonaStatType 키가 늘거나 바뀌어도 깨지지 않게 고정 키가 아닌 record 로 받는다. */
export const avatarSummarySchema = z.object({
  avatarId: z.string().min(1),
  name: z.string().min(1),
  // 서버가 생성하는 불변 6자 식별 태그 — 화면에는 `이름#해시태그` 로 붙여 쓴다.
  hashtag: z.string().min(1),
  // 계약상 "저장된 값이 없으면 빈 문자열" 이라 min(1) 을 걸면 실응답이 떨어진다.
  description: z.string(),
  stats: z.record(z.string(), statValue),
  // 계약상 non-null 이지만 tags 도입 전 서버 배포본은 키 자체가 없으므로 default 로 흡수한다.
  tags: z.array(z.string()).default([]),
  // 계약상 필수지만 color 도입(avating-core 0ed8958) 전 서버 배포본은 키가 없다 — 없으면 화면이 --id-none 회색으로 그린다.
  color: avatarColorSchema.optional(),
});
export type AvatarSummary = z.infer<typeof avatarSummarySchema>;

export const apiResponseAvatarSummary = z.object({ data: avatarSummarySchema });

/** 서버 AvatarSimCandidateResponse(GET /avatars/candidates) — 요약과 같은 필드에 요청 가능 여부만 더해진다. 진행 중 초대에 걸린 아바타도 false 로 목록에 남는다. */
export const avatarSimCandidateSchema = avatarSummarySchema.extend({
  canRequestSimulation: z.boolean(),
});
export type AvatarSimCandidate = z.infer<typeof avatarSimCandidateSchema>;

// 랜덤 조회라 커서가 없다. size 는 실제로 내려준 개수라 요청 size 보다 작을 수 있다.
export const avatarSimCandidateListSchema = z.object({
  items: z.array(avatarSimCandidateSchema),
  size: z.number().int().nonnegative(),
});
export type AvatarSimCandidateList = z.infer<typeof avatarSimCandidateListSchema>;

export const apiResponseAvatarSimCandidateList = z.object({ data: avatarSimCandidateListSchema });

/** 서버 AvatarDetailResponse(GET /avatars/{avatarId}) — 후보 조회와 필드가 같다. 없거나 비공개이거나 본인 아바타면 404 `AVATAR_404_002` 다. */
export type AvatarDetail = AvatarSimCandidate;

export const apiResponseAvatarDetail = z.object({ data: avatarSimCandidateSchema });

// 서버 PersonaStatType 7종. 파싱은 record 로 느슨하게 받고, 표시할 때만 이 목록·순서를 쓴다.
export const PERSONA_STAT_KEYS = [
  'OPENNESS',
  'IMAGINATION',
  'EXTROVERSION',
  'EMPATHY',
  'PLANNING_LEVEL',
  'HUMOROUS',
  'AFFECTION_EXPRESSION',
] as const satisfies readonly string[];
type PersonaStatKey = (typeof PERSONA_STAT_KEYS)[number];

const PERSONA_STAT_LABELS: Record<PersonaStatKey, string> = {
  OPENNESS: '개방성',
  IMAGINATION: '상상력',
  EXTROVERSION: '외향성',
  EMPATHY: '공감',
  PLANNING_LEVEL: '계획성',
  HUMOROUS: '유머',
  AFFECTION_EXPRESSION: '애정표현',
};

export type PersonaStatRow = { key: PersonaStatKey; label: string; value: number };

/** 서버 stats 를 표시용 행으로 바꾼다 — 아는 7지표만 정본 순서대로, 응답에 없는 지표는 빼고. 반올림은 표시 단계에서 한다. */
export function personaStatRows(stats: Record<string, number>): PersonaStatRow[] {
  return PERSONA_STAT_KEYS.flatMap((key) => {
    const value = stats[key];
    return value === undefined ? [] : [{ key, label: PERSONA_STAT_LABELS[key], value }];
  });
}
