import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarStatsRadar } from '../ui/AvatarStatsRadar';

const stats = {
  empathy: 81,
  proactivity: 52,
  humor: 69,
  sensitivity: 88,
  listening: 74,
  expressiveness: 60,
};

describe('AvatarStatsRadar', () => {
  it('HexRadar 와 6개의 Meter 가 렌더된다', () => {
    render(<AvatarStatsRadar stats={stats} />);
    expect(screen.getByRole('img', { name: '아바타 스탯 레이더' })).toBeInTheDocument();
    expect(screen.getAllByRole('meter')).toHaveLength(6);
  });

  it('각 stat 의 값이 Meter aria-valuenow + 우측 라벨로 노출된다', () => {
    render(<AvatarStatsRadar stats={stats} />);
    expect(screen.getByRole('meter', { name: '공감 지수' })).toHaveAttribute('aria-valuenow', '81');
    expect(screen.getByRole('meter', { name: '적극성' })).toHaveAttribute('aria-valuenow', '52');
    expect(screen.getByRole('meter', { name: '표현력' })).toHaveAttribute('aria-valuenow', '60');
  });

  it('섹션 heading 이 "아바타 스탯" 으로 노출된다', () => {
    render(<AvatarStatsRadar stats={stats} />);
    expect(screen.getByRole('heading', { name: '아바타 스탯' })).toBeInTheDocument();
  });
});
