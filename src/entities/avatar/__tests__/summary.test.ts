import { describe, it, expect } from 'vitest';
import { apiResponseAvatarSummary, avatarSummarySchema } from '../model';

const valid = {
  avatarId: '11111111-1111-4111-8111-111111111111',
  name: '루시',
  hashtag: 'A3K9Z7',
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
  tags: ['운동', '여행'],
};

describe('avatarSummarySchema (서버 AvatarSummaryResponse)', () => {
  it('정상 응답을 파싱한다', () => {
    expect(avatarSummarySchema.parse(valid)).toEqual(valid);
  });

  it('description 이 빈 문자열이어도 통과한다', () => {
    expect(avatarSummarySchema.parse({ ...valid, description: '' }).description).toBe('');
  });

  it('stats 의 소수 값을 보존한다', () => {
    expect(avatarSummarySchema.parse(valid).stats.OPENNESS).toBe(72.5);
  });

  it('tags 를 보존한다', () => {
    expect(avatarSummarySchema.parse(valid).tags).toEqual(['운동', '여행']);
  });

  it('tags 키가 없는 구버전 서버 응답은 빈 배열로 기본 처리한다', () => {
    const { tags: _omitted, ...withoutTags } = valid;
    expect(avatarSummarySchema.parse(withoutTags).tags).toEqual([]);
  });

  it('stats 값이 범위를 벗어나면 거부한다', () => {
    expect(() => avatarSummarySchema.parse({ ...valid, stats: { OPENNESS: 120 } })).toThrow();
  });

  it('필수 필드가 빠지면 거부한다', () => {
    const { avatarId: _omitted, ...withoutId } = valid;
    expect(() => avatarSummarySchema.parse(withoutId)).toThrow();
  });

  it('hashtag 를 보존하고, 빠지면 거부한다', () => {
    expect(avatarSummarySchema.parse(valid).hashtag).toBe('A3K9Z7');
    const { hashtag: _omitted, ...withoutHashtag } = valid;
    expect(() => avatarSummarySchema.parse(withoutHashtag)).toThrow();
  });

  it('color(# 없는 6자리 hex)를 보존한다', () => {
    expect(avatarSummarySchema.parse({ ...valid, color: '2C3886' }).color).toBe('2C3886');
  });

  it('color 키가 없는 구버전 서버 응답도 통과한다', () => {
    expect(avatarSummarySchema.parse(valid).color).toBeUndefined();
  });

  it('color 가 6자리 hex 가 아니면 거부한다', () => {
    expect(() => avatarSummarySchema.parse({ ...valid, color: '#2C3886' })).toThrow();
  });

  it('apiResponse 래퍼는 data 를 벗겨낸다', () => {
    expect(apiResponseAvatarSummary.parse({ data: valid }).data.name).toBe('루시');
  });
});
