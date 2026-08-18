import { describe, it, expect } from 'vitest';
import { apiResponseAvatarSummary, avatarSummarySchema } from '../model';

const valid = {
  schemaVersion: 1,
  avatarId: '11111111-1111-4111-8111-111111111111',
  name: '루시',
  description: '따뜻하고 유머 감각 넘치는 ENFP',
  stats: {
    OPENNESS: 72.5,
    IMAGINATION: 68.0,
    EXTROVERSION: 80.0,
    EMPATHY: 65.0,
    PLANNING_LEVEL: 45.0,
    HUMOROUS: 88.0,
    AFFECTION_EXPRESSION: 55.0,
  },
};

describe('avatarSummarySchema (서버 AvatarSummaryResponse)', () => {
  it('정상 응답을 파싱한다', () => {
    expect(avatarSummarySchema.parse(valid)).toEqual(valid);
  });

  // description 은 "저장된 값이 없으면 빈 문자열" 이라고 계약에 적혀 있다.
  it('description 이 빈 문자열이어도 통과한다', () => {
    expect(avatarSummarySchema.parse({ ...valid, description: '' }).description).toBe('');
  });

  // stats 는 PersonaStatType 7종이 키인 맵이고 값은 0.0~100.0 의 double 이다.
  // 정수를 강제하면 72.5 같은 실제 값이 떨어져 나간다.
  it('stats 의 소수 값을 보존한다', () => {
    expect(avatarSummarySchema.parse(valid).stats.OPENNESS).toBe(72.5);
  });

  it('stats 값이 범위를 벗어나면 거부한다', () => {
    expect(() => avatarSummarySchema.parse({ ...valid, stats: { OPENNESS: 120 } })).toThrow();
  });

  it('필수 필드가 빠지면 거부한다', () => {
    const { avatarId: _omitted, ...withoutId } = valid;
    expect(() => avatarSummarySchema.parse(withoutId)).toThrow();
  });

  it('apiResponse 래퍼는 data 를 벗겨낸다', () => {
    expect(apiResponseAvatarSummary.parse({ data: valid }).data.name).toBe('루시');
  });
});
