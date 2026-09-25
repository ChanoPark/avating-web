import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  AVATAR_IDENTITY_COLORS,
  AVATAR_IDENTITY_CLASS,
  DEFAULT_AVATAR_IDENTITY,
  identityFromHex,
  identityHex,
} from '../identity';

const TOKENS_CSS = readFileSync(
  resolve(__dirname, '../../../../app/styles/codex/tokens/colors.css'),
  'utf8'
);

describe('AVATAR_IDENTITY_COLORS', () => {
  it('정본 10색을 정본 순서대로 담는다', () => {
    expect(AVATAR_IDENTITY_COLORS.map((c) => c.label)).toEqual([
      '빨강',
      '주황',
      '노랑',
      '초록',
      '파랑',
      '남색',
      '보라',
      '갈색',
      '하늘',
      '핑크',
    ]);
  });

  it('서버로 보내는 hex 가 디자인 토큰(--id-<name>)과 같다', () => {
    for (const { name, hex } of AVATAR_IDENTITY_COLORS) {
      const match = new RegExp(`--id-${name}:\\s*#([0-9A-Fa-f]{6})`).exec(TOKENS_CSS);
      expect(match?.[1]?.toUpperCase(), name).toBe(hex);
    }
  });

  it('기본 선택은 정본 와이어프레임(S-02-02)의 남색이다', () => {
    expect(DEFAULT_AVATAR_IDENTITY).toBe('navy');
  });
});

describe('identityFromHex', () => {
  it('풀에 있는 hex 를 색 이름으로 바꾼다', () => {
    expect(identityFromHex('2C3886')).toBe('navy');
  });

  it('대소문자를 가리지 않는다', () => {
    expect(identityFromHex('c92f33')).toBe('red');
  });

  it('서버 기본값(2451A9)처럼 풀 밖의 색은 none 이다', () => {
    expect(identityFromHex('2451A9')).toBe('none');
  });

  it('색이 없으면 none 이다', () => {
    expect(identityFromHex(undefined)).toBe('none');
  });
});

describe('identityHex', () => {
  it('색 이름을 서버 형식 hex(# 없는 대문자 6자)로 바꾼다', () => {
    expect(identityHex('sky')).toBe('67C4F2');
  });
});

describe('AVATAR_IDENTITY_CLASS', () => {
  it('none 을 포함한 11개 모두에 배경·전경 클래스를 짝지운다', () => {
    for (const name of [...AVATAR_IDENTITY_COLORS.map((c) => c.name), 'none' as const]) {
      expect(AVATAR_IDENTITY_CLASS[name]).toBe(`bg-id-${name} text-id-${name}-fg`);
    }
  });
});
