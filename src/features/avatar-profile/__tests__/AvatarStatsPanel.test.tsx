import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarStatsPanel } from '../ui/AvatarStatsPanel';

const stats = {
  empathy: 81,
  proactivity: 52,
  humor: 69,
  sensitivity: 88,
  listening: 74,
  expressiveness: 60,
};

describe('AvatarStatsPanel', () => {
  it('6개의 StatBar(Meter) 가 렌더되고 레이더는 없다', () => {
    render(<AvatarStatsPanel stats={stats} />);
    expect(screen.getAllByRole('meter')).toHaveLength(6);
    expect(screen.queryByRole('img', { name: '아바타 스탯 레이더' })).not.toBeInTheDocument();
  });

  it('각 stat 의 값이 Meter aria-valuenow + 우측 라벨로 노출된다', () => {
    render(<AvatarStatsPanel stats={stats} />);
    expect(screen.getByRole('meter', { name: '공감 지수' })).toHaveAttribute('aria-valuenow', '81');
    expect(screen.getByRole('meter', { name: '적극성' })).toHaveAttribute('aria-valuenow', '52');
    expect(screen.getByRole('meter', { name: '표현력' })).toHaveAttribute('aria-valuenow', '60');
  });

  it('값 숫자는 tabular-nums 로 렌더된다', () => {
    render(<AvatarStatsPanel stats={stats} />);
    expect(screen.getByText('81')).toHaveClass('tnum');
  });

  it('섹션 heading 이 "아바타 스탯" 으로 노출된다', () => {
    render(<AvatarStatsPanel stats={stats} />);
    expect(screen.getByRole('heading', { name: '아바타 스탯' })).toBeInTheDocument();
  });
});
