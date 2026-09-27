import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AvatarStatsPanel } from '../ui/AvatarStatsPanel';

// 서버 PersonaStatType 7지표 — 값은 double 이다.
const stats = {
  OPENNESS: 72.5,
  IMAGINATION: 68,
  EXTROVERSION: 80,
  EMPATHY: 65,
  PLANNING_LEVEL: 45,
  HUMOROUS: 88,
  AFFECTION_EXPRESSION: 55,
};

// 대시보드 대표 아바타와 같은 PersonaStats(레이더 + 값 표)로 그린다.
describe('AvatarStatsPanel', () => {
  it('대시보드 대표 아바타처럼 레이더와 값 표를 함께 그린다', () => {
    render(<AvatarStatsPanel stats={stats} />);
    expect(screen.getByRole('img', { name: '아바타 스탯 레이더' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '성향 지표' })).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('값 표는 정본 순서의 한글 라벨과 반올림한 정수 값을 보여준다', () => {
    render(<AvatarStatsPanel stats={stats} />);
    const table = screen.getByRole('table', { name: '성향 지표' });
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((th) => th.textContent)
    ).toEqual(['개방성', '상상력', '외향성', '공감', '계획성', '유머', '애정표현']);
    // 72.5 는 표시 단계에서 반올림한다.
    expect(within(table).getByRole('row', { name: '개방성 73' })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: '유머 88' })).toBeInTheDocument();
  });

  it('카드는 @container 라 PersonaStats 가 카드 폭으로 레이더·표 배치를 정한다', () => {
    render(<AvatarStatsPanel stats={stats} />);
    expect(screen.getByRole('region', { name: '아바타 스탯' })).toHaveClass('@container');
  });

  it('응답에 없는 지표는 빼고, 모르는 키는 무시한다 — 축이 3개 미만이면 레이더 없이 표만 둔다', () => {
    render(<AvatarStatsPanel stats={{ EMPATHY: 10, UNKNOWN: 50 }} />);
    expect(screen.getAllByRole('rowheader')).toHaveLength(1);
    expect(screen.queryByRole('img', { name: '아바타 스탯 레이더' })).not.toBeInTheDocument();
  });

  it('섹션 heading 이 "아바타 스탯" 으로 노출된다', () => {
    render(<AvatarStatsPanel stats={stats} />);
    expect(screen.getByRole('heading', { name: '아바타 스탯' })).toBeInTheDocument();
  });
});
