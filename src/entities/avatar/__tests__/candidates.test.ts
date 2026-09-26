import { describe, it, expect } from 'vitest';
import {
  apiResponseAvatarSimCandidateList,
  avatarSimCandidateListSchema,
  avatarSimCandidateSchema,
} from '../model';

const candidate = {
  avatarId: '22222222-2222-4222-8222-222222222222',
  name: '하늘',
  hashtag: 'H7K2MP',
  description: '느긋하게 산책하는 걸 좋아해요',
  stats: {
    OPENNESS: 60,
    IMAGINATION: 55.5,
    EXTROVERSION: 30,
    EMPATHY: 82,
    PLANNING_LEVEL: 70,
    HUMOROUS: 40,
    AFFECTION_EXPRESSION: 65,
  },
  tags: ['산책', '사진'],
  canRequestSimulation: true,
};

describe('avatarSimCandidateSchema (서버 AvatarSimCandidateResponse)', () => {
  it('정상 응답을 파싱한다', () => {
    expect(avatarSimCandidateSchema.parse(candidate)).toEqual(candidate);
  });

  it('canRequestSimulation=false 를 보존한다 — 진행 중 초대에 걸린 아바타도 목록에 남는다', () => {
    const busy = { ...candidate, canRequestSimulation: false };
    expect(avatarSimCandidateSchema.parse(busy).canRequestSimulation).toBe(false);
  });

  it('canRequestSimulation 이 빠지면 거부한다', () => {
    const { canRequestSimulation: _omitted, ...rest } = candidate;
    expect(() => avatarSimCandidateSchema.parse(rest)).toThrow();
  });

  it('hashtag 가 빠지면 거부한다', () => {
    const { hashtag: _omitted, ...rest } = candidate;
    expect(() => avatarSimCandidateSchema.parse(rest)).toThrow();
  });

  it('description 빈 문자열을 허용한다 (서버가 null 을 빈 문자열로 내려준다)', () => {
    expect(avatarSimCandidateSchema.parse({ ...candidate, description: '' }).description).toBe('');
  });
});

describe('avatarSimCandidateListSchema', () => {
  it('items 와 size 를 파싱한다', () => {
    const parsed = avatarSimCandidateListSchema.parse({ items: [candidate], size: 1 });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.size).toBe(1);
  });

  it('후보가 없으면 빈 배열이다', () => {
    expect(avatarSimCandidateListSchema.parse({ items: [], size: 0 }).items).toEqual([]);
  });

  it('apiResponse 래퍼는 data 를 벗겨낸다', () => {
    const parsed = apiResponseAvatarSimCandidateList.parse({
      data: { items: [candidate], size: 1 },
    });
    expect(parsed.data.items[0]?.name).toBe('하늘');
  });
});
