import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvatarCard } from '../AvatarCard';
import type { RecommendedAvatar } from '@entities/dashboard';

const avatar: RecommendedAvatar = {
  id: 'avatar-1',
  initials: 'MN',
  name: 'Moonlit',
  level: 3,
  status: 'online',
  verified: true,
  type: '내향 · 낭만형',
  tags: ['서촌', '카페투어'],
  matchRate: 87,
};

function renderCard(overrides: Partial<RecommendedAvatar> = {}) {
  const onOpen = vi.fn();
  const onMatch = vi.fn();
  render(<AvatarCard avatar={{ ...avatar, ...overrides }} onOpen={onOpen} onMatch={onMatch} />);
  return { onOpen, onMatch };
}

describe('AvatarCard', () => {
  it('이름·인증 배지·성향·관심사 태그가 렌더된다', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Moonlit' })).toBeInTheDocument();
    expect(screen.getByText('인증')).toBeInTheDocument();
    expect(screen.getByText('내향 · 낭만형')).toBeInTheDocument();
    expect(screen.getByText('서촌')).toBeInTheDocument();
  });

  it('예상 호감도 점수는 tabular-nums 로 렌더된다', () => {
    renderCard();
    expect(screen.getByText('예상 호감도')).toBeInTheDocument();
    expect(screen.getByText('87')).toHaveClass('tnum');
  });

  it('매칭 버튼은 secondary(흰 서피스 + 파란 테두리)다', () => {
    renderCard();
    const match = screen.getByRole('button', { name: /매칭/ });
    expect(match).toHaveClass('bg-surface');
    expect(match).toHaveClass('border-primary');
    expect(match).not.toHaveClass('bg-primary');
  });

  it('이름 클릭은 onOpen, 매칭 클릭은 onMatch 를 호출한다', async () => {
    const user = userEvent.setup();
    const { onOpen, onMatch } = renderCard();

    await user.click(screen.getByRole('button', { name: 'Moonlit' }));
    expect(onOpen).toHaveBeenCalledWith('avatar-1');

    await user.click(screen.getByRole('button', { name: /매칭/ }));
    expect(onMatch).toHaveBeenCalledWith('avatar-1');
  });

  it('verified=false 면 인증 배지가 없다', () => {
    renderCard({ verified: false });
    expect(screen.queryByText('인증')).not.toBeInTheDocument();
  });
});
