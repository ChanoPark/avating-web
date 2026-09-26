import { describe, it, expect } from 'vitest';
import { avatarInitial } from '../avatarInitial';

describe('avatarInitial', () => {
  it('한글 이름은 첫 음절을 돌려준다', () => {
    expect(avatarInitial('루시')).toBe('루');
  });

  it('영문 이름은 첫 글자를 돌려준다 (대문자 표기는 CSS 몫)', () => {
    expect(avatarInitial('moonlit')).toBe('m');
  });

  it('서로게이트 쌍을 반으로 자르지 않는다', () => {
    expect(avatarInitial('🌙달빛')).toBe('🌙');
  });

  it('빈 문자열은 빈 문자열이다', () => {
    expect(avatarInitial('')).toBe('');
  });
});
