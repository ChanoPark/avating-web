import { describe, it, expect } from 'vitest';
import { apiResponseOwnedAvatarPage, ownedAvatarSchema } from '../model';

const owned = {
  avatarId: '11111111-1111-4111-8111-111111111111',
  name: '홍길동',
  hashtag: 'A3K9Z7',
  color: '2451A9',
  description: '따뜻하고 유머 감각 넘치는 ENFP',
  isPrimary: true,
  isVisible: false,
  tags: ['운동', '여행'],
  canJoinSimulation: true,
};

describe('ownedAvatarSchema (서버 OwnedAvatarResponse)', () => {
  it('실서버 응답 형상을 그대로 파싱한다', () => {
    expect(ownedAvatarSchema.parse(owned)).toEqual(owned);
  });

  it('canJoinSimulation=false 를 보존한다 — 진행 중 초대에 걸린 아바타도 목록에 남는다', () => {
    expect(ownedAvatarSchema.parse({ ...owned, canJoinSimulation: false }).canJoinSimulation).toBe(
      false
    );
  });

  it('canJoinSimulation 이 빠지면 거부한다', () => {
    const { canJoinSimulation: _omitted, ...rest } = owned;
    expect(() => ownedAvatarSchema.parse(rest)).toThrow();
  });

  it('description 빈 문자열을 허용한다 (서버가 null 을 빈 문자열로 내려준다)', () => {
    expect(ownedAvatarSchema.parse({ ...owned, description: '' }).description).toBe('');
  });

  it('color 가 6자리 hex 가 아니면 거부한다', () => {
    expect(() => ownedAvatarSchema.parse({ ...owned, color: '#2451A9' })).toThrow();
  });
});

describe('apiResponseOwnedAvatarPage', () => {
  it('마지막 페이지는 nextCursor 키가 없어도 파싱한다 (Jackson NON_NULL)', () => {
    const parsed = apiResponseOwnedAvatarPage.parse({
      data: { content: [owned], hasNext: false },
    }).data;
    expect(parsed.content).toHaveLength(1);
    expect(parsed.hasNext).toBe(false);
    expect(parsed).not.toHaveProperty('nextCursor');
  });

  it('다음 페이지가 있으면 nextCursor 를 보존한다', () => {
    const parsed = apiResponseOwnedAvatarPage.parse({
      data: { content: [owned], nextCursor: 'eyJ4Ijox', hasNext: true },
    }).data;
    expect(parsed.nextCursor).toBe('eyJ4Ijox');
  });

  it('아바타가 없으면 빈 배열이다', () => {
    const parsed = apiResponseOwnedAvatarPage.parse({ data: { content: [], hasNext: false } });
    expect(parsed.data.content).toEqual([]);
  });
});
