import { describe, it, expect } from 'vitest';
import { avatarStatusSchema, avatarBaseSchema } from '../model';

const validAvatarBase = {
  id: 'avatar-1',
  initials: 'HW',
  name: 'Moonlit',
  handle: '@moonlit',
  level: 3,
  status: 'online' as const,
  verified: true,
};

describe('avatarStatusSchema', () => {
  it('online 은 정상 파싱된다', () => {
    expect(avatarStatusSchema.parse('online')).toBe('online');
  });

  it('busy 는 정상 파싱된다', () => {
    expect(avatarStatusSchema.parse('busy')).toBe('busy');
  });

  it('offline 은 정상 파싱된다', () => {
    expect(avatarStatusSchema.parse('offline')).toBe('offline');
  });

  it('임의 문자열은 실패한다', () => {
    expect(() => avatarStatusSchema.parse('inactive')).toThrow();
  });

  it('빈 문자열은 실패한다', () => {
    expect(() => avatarStatusSchema.parse('')).toThrow();
  });

  it('숫자는 실패한다', () => {
    expect(() => avatarStatusSchema.parse(1)).toThrow();
  });
});

describe('avatarBaseSchema', () => {
  it('정상 객체를 파싱한다', () => {
    const result = avatarBaseSchema.parse(validAvatarBase);
    expect(result.id).toBe('avatar-1');
    expect(result.initials).toBe('HW');
    expect(result.name).toBe('Moonlit');
    expect(result.level).toBe(3);
    expect(result.status).toBe('online');
    expect(result.verified).toBe(true);
  });

  it('initials 가 3자이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, initials: 'ABC' })).toThrow();
  });

  it('initials 가 빈 문자열이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, initials: '' })).toThrow();
  });

  it('level 이 0이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, level: 0 })).toThrow();
  });

  it('level 이 소수이면 실패한다 (int 강제)', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, level: 1.5 })).toThrow();
  });

  it('status 가 임의 문자열이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, status: 'away' })).toThrow();
  });

  it('추가 필드는 무시된다 (Zod strip 기본 동작)', () => {
    const result = avatarBaseSchema.parse({ ...validAvatarBase, extra: 'ignored' });
    expect(result).not.toHaveProperty('extra');
  });

  it('id 가 빈 문자열이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, id: '' })).toThrow();
  });

  it('name 이 빈 문자열이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, name: '' })).toThrow();
  });

  it('handle 이 빈 문자열이면 실패한다', () => {
    expect(() => avatarBaseSchema.parse({ ...validAvatarBase, handle: '' })).toThrow();
  });

  it('verified 가 없으면 실패한다', () => {
    const { verified: _omit, ...without } = validAvatarBase;
    expect(() => avatarBaseSchema.parse(without)).toThrow();
  });
});
