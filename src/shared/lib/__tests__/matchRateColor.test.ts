import { describe, it, expect } from 'vitest';
import { matchRateColor } from '../matchRateColor';

describe('matchRateColor', () => {
  it('85 이상은 success 를 반환한다', () => {
    expect(matchRateColor(85)).toBe('success');
  });

  it('100 은 success 를 반환한다', () => {
    expect(matchRateColor(100)).toBe('success');
  });

  it('86 은 success 를 반환한다', () => {
    expect(matchRateColor(86)).toBe('success');
  });

  it('70 은 default 를 반환한다 (경계값)', () => {
    expect(matchRateColor(70)).toBe('default');
  });

  it('84 는 default 를 반환한다 (경계값)', () => {
    expect(matchRateColor(84)).toBe('default');
  });

  it('75 는 default 를 반환한다', () => {
    expect(matchRateColor(75)).toBe('default');
  });

  it('69 는 warning 을 반환한다 (경계값)', () => {
    expect(matchRateColor(69)).toBe('warning');
  });

  it('0 은 warning 을 반환한다', () => {
    expect(matchRateColor(0)).toBe('warning');
  });

  it('50 은 warning 을 반환한다', () => {
    expect(matchRateColor(50)).toBe('warning');
  });

  it('경계값 85: success, 84: default 가 정확하다', () => {
    expect(matchRateColor(85)).toBe('success');
    expect(matchRateColor(84)).toBe('default');
  });

  it('경계값 70: default, 69: warning 이 정확하다', () => {
    expect(matchRateColor(70)).toBe('default');
    expect(matchRateColor(69)).toBe('warning');
  });
});
