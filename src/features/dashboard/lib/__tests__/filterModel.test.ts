import { describe, it, expect } from 'vitest';
import {
  initialFilter,
  toggleFilter,
  resetFilter,
  isAllActive,
  serializeFilter,
} from '../filterModel';
import type { RecommendedAvatarFilter } from '@entities/dashboard/model';

describe('initialFilter', () => {
  it('모든 필드가 false 이다 ("전체" 활성으로 해석)', () => {
    expect(initialFilter).toEqual({
      online: false,
      introvert: false,
      extrovert: false,
      verified: false,
    });
  });
});

describe('toggleFilter', () => {
  it('online 토글 시 online 이 true 로 바뀐다', () => {
    const result = toggleFilter(initialFilter, 'online');
    expect(result.online).toBe(true);
    expect(result.introvert).toBe(false);
    expect(result.extrovert).toBe(false);
    expect(result.verified).toBe(false);
  });

  it('이미 true 인 online 토글 시 false 로 바뀐다', () => {
    const filter: RecommendedAvatarFilter = { ...initialFilter, online: true };
    const result = toggleFilter(filter, 'online');
    expect(result.online).toBe(false);
  });

  it('introvert 토글', () => {
    const result = toggleFilter(initialFilter, 'introvert');
    expect(result.introvert).toBe(true);
    expect(result.online).toBe(false);
  });

  it('extrovert 토글', () => {
    const result = toggleFilter(initialFilter, 'extrovert');
    expect(result.extrovert).toBe(true);
  });

  it('verified 토글', () => {
    const result = toggleFilter(initialFilter, 'verified');
    expect(result.verified).toBe(true);
  });

  it('원본 객체를 변이하지 않는다 (불변성)', () => {
    const original = { ...initialFilter };
    toggleFilter(original, 'online');
    expect(original.online).toBe(false);
  });
});

describe('resetFilter', () => {
  it('모든 필드를 false 로 만든다 (전체 선택)', () => {
    const filter: RecommendedAvatarFilter = {
      online: true,
      introvert: true,
      extrovert: false,
      verified: true,
    };
    const result = resetFilter(filter);
    expect(result).toEqual({
      online: false,
      introvert: false,
      extrovert: false,
      verified: false,
    });
  });

  it('이미 전체인 상태에서 호출해도 전체 상태로 유지된다', () => {
    const result = resetFilter(initialFilter);
    expect(result).toEqual(initialFilter);
  });
});

describe('isAllActive', () => {
  it('모든 false → true 반환', () => {
    expect(isAllActive(initialFilter)).toBe(true);
  });

  it('하나라도 true 이면 false 반환', () => {
    expect(isAllActive({ ...initialFilter, online: true })).toBe(false);
  });

  it('전부 true 이면 false 반환', () => {
    expect(isAllActive({ online: true, introvert: true, extrovert: true, verified: true })).toBe(
      false
    );
  });
});

describe('serializeFilter', () => {
  it('모두 false 이면 빈 문자열을 반환한다 (전체 선택)', () => {
    const result = serializeFilter(initialFilter);
    expect(result).toBe('');
  });

  it('online 만 true 이면 "online" 을 반환한다', () => {
    const result = serializeFilter({ ...initialFilter, online: true });
    expect(result).toBe('online');
  });

  it('online + introvert true 이면 "online,introvert" 을 반환한다', () => {
    const result = serializeFilter({ ...initialFilter, online: true, introvert: true });
    expect(result).toContain('online');
    expect(result).toContain('introvert');
    expect(result.includes(',')).toBe(true);
  });

  it('직렬화 결과에 false 인 키는 포함되지 않는다', () => {
    const result = serializeFilter({ ...initialFilter, online: true });
    expect(result).not.toContain('introvert');
    expect(result).not.toContain('extrovert');
    expect(result).not.toContain('verified');
  });
});
