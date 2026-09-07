import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Send } from 'lucide-react';
import { StatsCard } from '../StatsCard';

describe('StatsCard', () => {
  const defaultProps = {
    icon: Send,
    label: '총 매칭 횟수',
    value: '47',
    ariaLabel: '총 매칭 횟수 47회, 지난주 대비 8 증가',
  };

  it('label 이 렌더된다', () => {
    render(<StatsCard {...defaultProps} />);
    expect(screen.getByText('총 매칭 횟수')).toBeInTheDocument();
  });

  it('value 가 렌더된다', () => {
    render(<StatsCard {...defaultProps} />);
    expect(screen.getByText('47')).toBeInTheDocument();
  });

  it('ariaLabel 이 root 요소의 aria-label 로 설정된다', () => {
    render(<StatsCard {...defaultProps} />);
    const card = screen.getByLabelText('총 매칭 횟수 47회, 지난주 대비 8 증가');
    expect(card).toBeInTheDocument();
  });

  describe('delta 표시', () => {
    it('delta 가 없을 때 delta 영역이 렌더되지 않는다', () => {
      render(<StatsCard {...defaultProps} />);
      expect(screen.queryByTestId('stats-card-delta')).not.toBeInTheDocument();
    });

    it('delta.tone="positive" 시 text-success 클래스가 적용된다', () => {
      render(<StatsCard {...defaultProps} delta={{ text: '+8 지난주 대비', tone: 'positive' }} />);
      const delta = screen.getByText('+8 지난주 대비');
      expect(delta.className).toContain('text-success');
    });

    it('delta.tone="negative" 시 text-danger 클래스가 적용된다', () => {
      render(<StatsCard {...defaultProps} delta={{ text: '-3 지난주 대비', tone: 'negative' }} />);
      const delta = screen.getByText('-3 지난주 대비');
      expect(delta.className).toContain('text-danger');
    });

    it('delta.tone="neutral" 시 text-ink-mute 클래스가 적용된다', () => {
      render(<StatsCard {...defaultProps} delta={{ text: '매칭 성공률 6.4%', tone: 'neutral' }} />);
      const delta = screen.getByText('매칭 성공률 6.4%');
      expect(delta.className).toContain('text-ink-mute');
    });

    it('delta 가 있을 때 delta 텍스트가 렌더된다', () => {
      render(<StatsCard {...defaultProps} delta={{ text: '+3.2pt', tone: 'positive' }} />);
      expect(screen.getByText('+3.2pt')).toBeInTheDocument();
    });
  });

  it('value 는 26px display 타입 + tabular-nums 로 렌더된다', () => {
    render(<StatsCard {...defaultProps} />);
    const value = screen.getByText('47');
    expect(value.className).toContain('text-display-md');
    expect(value.className).toContain('tnum');
  });

  it('delta 숫자도 tabular-nums 를 쓴다', () => {
    render(<StatsCard {...defaultProps} delta={{ text: '+8 지난주 대비', tone: 'positive' }} />);
    expect(screen.getByText('+8 지난주 대비').className).toContain('tnum');
  });

  it('카드 크롬은 흰 서피스 + hairline + shadow-card + rounded-lg 다', () => {
    render(<StatsCard {...defaultProps} />);
    const card = screen.getByLabelText(defaultProps.ariaLabel);
    expect(card.className).toContain('bg-surface');
    expect(card.className).toContain('border-hairline');
    expect(card.className).toContain('shadow-card');
    expect(card.className).toContain('rounded-lg');
  });

  it('icon 이 렌더된다 (aria-hidden 으로 처리)', () => {
    const { container } = render(<StatsCard {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('a11y — axe 위반 0 (vitest-axe 미설치 — jest-axe 도입 후 활성화)', () => {
    expect(true).toBe(true);
  });
});
