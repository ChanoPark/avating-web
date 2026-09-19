import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvatarCard } from '../AvatarCard';
import type { AvatarSimCandidate } from '@entities/avatar';

const avatar: AvatarSimCandidate = {
  schemaVersion: 1,
  avatarId: '22222222-2222-4222-8222-222222222222',
  name: '하늘',
  hashtag: 'H7K2MP',
  description: '느긋하게 산책하는 걸 좋아해요',
  stats: { OPENNESS: 60, EXTROVERSION: 30 },
  tags: ['산책', '사진', '전시', '카페투어'],
  canRequestSimulation: true,
};

function renderCard(overrides: Partial<AvatarSimCandidate> = {}) {
  const onOpen = vi.fn();
  const onMatch = vi.fn();
  render(<AvatarCard avatar={{ ...avatar, ...overrides }} onOpen={onOpen} onMatch={onMatch} />);
  return { onOpen, onMatch };
}

describe('AvatarCard', () => {
  it('이니셜·이름#해시태그·한 줄 소개가 렌더된다', () => {
    renderCard();
    expect(screen.getByRole('button', { name: '하늘#H7K2MP' })).toBeInTheDocument();
    expect(screen.getByText('하')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('느긋하게 산책하는 걸 좋아해요')).toBeInTheDocument();
  });

  it('관심 태그는 앞의 3개만 보여준다', () => {
    renderCard();
    expect(screen.getByText('산책')).toBeInTheDocument();
    expect(screen.getByText('전시')).toBeInTheDocument();
    expect(screen.queryByText('카페투어')).not.toBeInTheDocument();
  });

  it('태그가 없으면 태그 목록을 그리지 않는다', () => {
    renderCard({ tags: [] });
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('한 줄 소개가 빈 문자열이면 소개 줄을 그리지 않는다', () => {
    renderCard({ description: '' });
    expect(screen.queryByText('느긋하게 산책하는 걸 좋아해요')).not.toBeInTheDocument();
  });

  // 서버가 주지 않는 값(인증·예상 호감도)을 지어내지 않는다.
  it('서버에 없는 인증 배지·예상 호감도는 그리지 않는다', () => {
    renderCard();
    expect(screen.queryByText('인증')).not.toBeInTheDocument();
    expect(screen.queryByText('예상 호감도')).not.toBeInTheDocument();
  });

  it('매칭 버튼은 secondary(무채색 약한 채움)다 — 파란 테두리가 아니다', () => {
    renderCard();
    const match = screen.getByRole('button', { name: /매칭/ });
    expect(match).toHaveClass('bg-fill-weak');
    expect(match.className).not.toContain('border-mark');
    expect(match).not.toHaveClass('bg-action');
  });

  it('이름 클릭은 onOpen, 매칭 클릭은 onMatch 를 avatarId 로 호출한다', async () => {
    const user = userEvent.setup();
    const { onOpen, onMatch } = renderCard();

    await user.click(screen.getByRole('button', { name: '하늘#H7K2MP' }));
    expect(onOpen).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');

    await user.click(screen.getByRole('button', { name: /매칭/ }));
    expect(onMatch).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
  });

  describe('canRequestSimulation=false (진행 중 초대에 걸린 아바타)', () => {
    it('"매칭 중" 상태를 보여주고 매칭 버튼을 비활성화한다', async () => {
      const user = userEvent.setup();
      const { onMatch } = renderCard({ canRequestSimulation: false });

      expect(screen.getByText('매칭 중')).toBeInTheDocument();
      const match = screen.getByRole('button', { name: /매칭/ });
      expect(match).toBeDisabled();

      await user.click(match);
      expect(onMatch).not.toHaveBeenCalled();
    });

    it('카드(이름) 클릭은 여전히 가능하다', async () => {
      const user = userEvent.setup();
      const { onOpen } = renderCard({ canRequestSimulation: false });

      await user.click(screen.getByRole('button', { name: '하늘#H7K2MP' }));
      expect(onOpen).toHaveBeenCalledOnce();
    });
  });

  it('요청 가능한 아바타에는 "매칭 중" 상태가 없다', () => {
    renderCard();
    expect(screen.queryByText('매칭 중')).not.toBeInTheDocument();
  });
});
