import { describe, it, expect } from 'vitest';
import { apiResponseAvatarDetail } from '../model';

// 서버 AvatarDetailResponse(GET /api/avatars/{avatarId}) — avating-core db29da9.
describe('apiResponseAvatarDetail', () => {
  const parseDetail = (data: unknown) => apiResponseAvatarDetail.parse({ data }).data;

  const validDetail = {
    avatarId: '11111111-1111-4111-8111-111111111111',
    name: '루시',
    hashtag: 'A3K9Z7',
    description: '따뜻하고 유머 감각 넘치는 ENFP',
    color: 'FF8800',
    stats: { OPENNESS: 72.5, AFFECTION_EXPRESSION: 55 },
    tags: ['운동', '여행'],
    canRequestSimulation: true,
  };

  it('실서버 응답 형상을 그대로 파싱한다', () => {
    expect(parseDetail(validDetail)).toEqual(validDetail);
  });

  it('color 키가 없는 배포본 응답도 파싱한다 (core 0ed8958 배포 전)', () => {
    const { color: _omit, ...without } = validDetail;
    expect(parseDetail(without)).not.toHaveProperty('color');
  });

  it('canRequestSimulation 이 없으면 실패한다', () => {
    const { canRequestSimulation: _omit, ...without } = validDetail;
    expect(() => parseDetail(without)).toThrow();
  });

  it('상대 아바타 정보에 세션 이력(호감도·턴) 필드는 포함되지 않는다 (프라이버시)', () => {
    const parsed = parseDetail({
      ...validDetail,
      sessionHistory: [{ id: 'x', turn: 1, totalTurns: 12, affinity: 50, result: 'ended' }],
    });
    expect(parsed).not.toHaveProperty('sessionHistory');
  });
});
