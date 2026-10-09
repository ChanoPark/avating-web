import { describe, it, expect } from 'vitest';
import { isNearBottom } from '../lib/isNearBottom';

describe('isNearBottom', () => {
  it('맨 아래에 닿아 있으면 true 다', () => {
    expect(isNearBottom({ scrollTop: 600, clientHeight: 400, scrollHeight: 1000 })).toBe(true);
  });

  it('말풍선 한 줄쯤 덜 내려온 것은 아래에 있는 것으로 본다', () => {
    expect(isNearBottom({ scrollTop: 552, clientHeight: 400, scrollHeight: 1000 })).toBe(true);
  });

  it('그보다 위를 보고 있으면 false 다', () => {
    expect(isNearBottom({ scrollTop: 551, clientHeight: 400, scrollHeight: 1000 })).toBe(false);
    expect(isNearBottom({ scrollTop: 0, clientHeight: 400, scrollHeight: 1000 })).toBe(false);
  });

  it('넘치지 않는 짧은 대화는 늘 아래에 있다', () => {
    expect(isNearBottom({ scrollTop: 0, clientHeight: 400, scrollHeight: 300 })).toBe(true);
  });
});
