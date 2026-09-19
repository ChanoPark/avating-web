import { describe, it, expect } from 'vitest';
import { personaStatRows } from '../model';

describe('personaStatRows', () => {
  it('서버 enum 순서대로 라벨과 값을 짝지어 돌려준다', () => {
    const rows = personaStatRows({
      AFFECTION_EXPRESSION: 55,
      OPENNESS: 72.5,
      HUMOROUS: 88,
      EMPATHY: 65,
      IMAGINATION: 68,
      PLANNING_LEVEL: 45,
      EXTROVERSION: 80,
    });
    expect(rows.map((r) => r.label)).toEqual([
      '개방성',
      '상상력',
      '외향성',
      '공감',
      '계획성',
      '유머',
      '애정표현',
    ]);
    // 반올림은 표시 단계에서 한다 — 원값을 그대로 넘긴다.
    expect(rows[0]).toEqual({ key: 'OPENNESS', label: '개방성', value: 72.5 });
  });

  it('응답에 없는 지표는 행을 만들지 않는다', () => {
    const rows = personaStatRows({ EMPATHY: 60, OPENNESS: 70 });
    expect(rows.map((r) => r.key)).toEqual(['OPENNESS', 'EMPATHY']);
  });

  it('서버가 모르는 키를 보내도 표시하지 않는다', () => {
    expect(personaStatRows({ UNKNOWN_STAT: 10 })).toEqual([]);
  });
});
