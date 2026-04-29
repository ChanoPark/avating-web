import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvatarListRow } from '../AvatarListRow';

const defaultProps = {
  initials: 'HW',
  name: 'Moonlit',
  handle: '@moonlit',
  type: '내향 · 낭만형',
  tags: ['서촌', '카페투어'],
  matchRate: 87,
  status: 'online' as const,
  verified: false,
  onRowClick: vi.fn(),
  onMatchClick: vi.fn(),
};

describe('AvatarListRow', () => {
  describe('기본 렌더', () => {
    it('이름이 렌더된다', () => {
      render(<AvatarListRow {...defaultProps} />);
      expect(screen.getByText('Moonlit')).toBeInTheDocument();
    });

    it('handle 이 렌더된다', () => {
      render(<AvatarListRow {...defaultProps} />);
      expect(screen.getByText('@moonlit')).toBeInTheDocument();
    });

    it('type 이 렌더된다', () => {
      render(<AvatarListRow {...defaultProps} />);
      expect(screen.getByText('내향 · 낭만형')).toBeInTheDocument();
    });

    it('매칭 버튼이 렌더된다', () => {
      render(<AvatarListRow {...defaultProps} />);
      expect(screen.getByRole('button', { name: /매칭/ })).toBeInTheDocument();
    });

    it('StatusDot 의 a11y 라벨이 렌더된다', () => {
      render(<AvatarListRow {...defaultProps} status="online" />);
      const dot = screen.getByLabelText('온라인');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('matchRate 색상', () => {
    it('matchRate 87 (>= 85) → text-success 클래스', () => {
      render(<AvatarListRow {...defaultProps} matchRate={87} />);
      const rateText = screen.getByText(/87/);
      expect(rateText.className).toContain('text-success');
    });

    it('matchRate 75 (70-84) → default 텍스트 스타일', () => {
      render(<AvatarListRow {...defaultProps} matchRate={75} />);
      const rateText = screen.getByText(/75/);
      const className = rateText.className;
      expect(className).not.toContain('text-success');
      expect(className).not.toContain('text-warning');
    });

    it('matchRate 65 (< 70) → text-warning 클래스', () => {
      render(<AvatarListRow {...defaultProps} matchRate={65} />);
      const rateText = screen.getByText(/65/);
      expect(rateText.className).toContain('text-warning');
    });
  });

  describe('verified', () => {
    it('verified=true 시 인증 Tag 가 렌더된다', () => {
      render(<AvatarListRow {...defaultProps} verified />);
      const verifiedTag = screen.getByText(/인증/);
      expect(verifiedTag).toBeInTheDocument();
    });

    it('verified=false 시 인증 Tag 가 없다', () => {
      render(<AvatarListRow {...defaultProps} verified={false} />);
      expect(screen.queryByText(/인증/)).not.toBeInTheDocument();
    });
  });

  describe('이벤트 핸들링', () => {
    it('행 클릭 시 onRowClick 이 호출된다', async () => {
      const onRowClick = vi.fn();
      const user = userEvent.setup();
      render(<AvatarListRow {...defaultProps} onRowClick={onRowClick} />);
      await user.click(screen.getByText('Moonlit'));
      expect(onRowClick).toHaveBeenCalledOnce();
    });

    it('"매칭" 버튼 클릭 시 onMatchClick 이 호출된다', async () => {
      const onMatchClick = vi.fn();
      const user = userEvent.setup();
      render(<AvatarListRow {...defaultProps} onMatchClick={onMatchClick} />);
      await user.click(screen.getByRole('button', { name: /매칭/ }));
      expect(onMatchClick).toHaveBeenCalledOnce();
    });

    it('"매칭" 버튼 클릭 시 onRowClick 이 호출되지 않는다 (stopPropagation)', async () => {
      const onRowClick = vi.fn();
      const onMatchClick = vi.fn();
      const user = userEvent.setup();
      render(
        <AvatarListRow {...defaultProps} onRowClick={onRowClick} onMatchClick={onMatchClick} />
      );
      await user.click(screen.getByRole('button', { name: /매칭/ }));
      expect(onMatchClick).toHaveBeenCalledOnce();
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it('키보드 Enter 로 행 활성화 시 onRowClick 이 호출된다', async () => {
      const onRowClick = vi.fn();
      const user = userEvent.setup();
      render(<AvatarListRow {...defaultProps} onRowClick={onRowClick} />);
      const row = screen.getByRole('row') ?? screen.getByTestId('avatar-list-row');
      row.focus();
      await user.keyboard('{Enter}');
      expect(onRowClick).toHaveBeenCalledOnce();
    });
  });

  describe('status', () => {
    it('status=online → StatusDot 온라인 라벨', () => {
      render(<AvatarListRow {...defaultProps} status="online" />);
      expect(screen.getByLabelText('온라인')).toBeInTheDocument();
    });

    it('status=busy → StatusDot 소개팅 중 라벨', () => {
      render(<AvatarListRow {...defaultProps} status="busy" />);
      expect(screen.getByLabelText('소개팅 중')).toBeInTheDocument();
    });

    it('status=offline → StatusDot 오프라인 라벨', () => {
      render(<AvatarListRow {...defaultProps} status="offline" />);
      expect(screen.getByLabelText('오프라인')).toBeInTheDocument();
    });
  });
});
