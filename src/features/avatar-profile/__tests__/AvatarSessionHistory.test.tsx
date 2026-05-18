import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarSessionHistory } from '../ui/AvatarSessionHistory';
import type { AvatarSessionHistoryItem } from '@entities/avatar';

const items: AvatarSessionHistoryItem[] = [
  {
    id: 's-1',
    turn: 12,
    totalTurns: 12,
    affinity: 91,
    result: 'matched',
    endedAt: '2026-04-21T13:21:00.000Z',
  },
  {
    id: 's-2',
    turn: 8,
    totalTurns: 12,
    affinity: 62,
    result: 'ended',
    endedAt: '2026-04-18T14:02:00.000Z',
  },
];

describe('AvatarSessionHistory', () => {
  it('row 마다 turn + 결과 Tag + 호감도 가 표시된다', () => {
    render(<AvatarSessionHistory items={items} />);
    expect(screen.getByText('TURN 12/12')).toBeInTheDocument();
    expect(screen.getByText('매칭 성공')).toBeInTheDocument();
    expect(screen.getByText('호감도 91')).toBeInTheDocument();
    expect(screen.getByText('TURN 8/12')).toBeInTheDocument();
    expect(screen.getByText('종료')).toBeInTheDocument();
    expect(screen.getByText('호감도 62')).toBeInTheDocument();
  });

  it('빈 배열일 때 안내 텍스트를 노출한다', () => {
    render(<AvatarSessionHistory items={[]} />);
    expect(screen.getByText('아직 세션 이력이 없어요.')).toBeInTheDocument();
  });

  it('관전 버튼은 v1 에서 disabled + "준비 중" aria-label 을 가진다', () => {
    render(<AvatarSessionHistory items={items} />);
    const watch = screen.getByRole('button', { name: '관전 (준비 중)' });
    expect(watch).toBeDisabled();
    expect(watch).toHaveAttribute('title', '관전 화면 준비 중');
  });
});
