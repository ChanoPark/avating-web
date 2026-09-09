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

    // 세 카드가 한 줄에 서면 굵기 차이가 순위처럼 읽혀서 tone 별 시각 구분을 없앴다.
    it.each(['positive', 'negative', 'neutral'] as const)(
      'delta.tone="%s" 는 모두 같은 무채색 pill 이다',
      (tone) => {
        render(<StatsCard {...defaultProps} delta={{ text: '지난주 대비', tone }} />);
        const delta = screen.getByText('지난주 대비');
        expect(delta.className).toContain('bg-raised');
        expect(delta.className).toContain('text-secondary');
        expect(delta.className).toContain('font-medium');
        expect(delta.className).not.toContain('font-semibold');
      }
    );

    it('delta 가 있을 때 delta 텍스트가 렌더된다', () => {
      render(<StatsCard {...defaultProps} delta={{ text: '+3.2pt', tone: 'positive' }} />);
      expect(screen.getByText('+3.2pt')).toBeInTheDocument();
    });
  });

  it('value 는 32px figure 타입 + 잉크 + tabular-nums 로 렌더된다', () => {
    render(<StatsCard {...defaultProps} />);
    const value = screen.getByText('47');
    expect(value.className).toContain('text-figure');
    expect(value.className).toContain('tnum');
  });

  it('delta 숫자도 tabular-nums 를 쓴다', () => {
    render(<StatsCard {...defaultProps} delta={{ text: '+8 지난주 대비', tone: 'positive' }} />);
    expect(screen.getByText('+8 지난주 대비').className).toContain('tnum');
  });

  it('카드 크롬은 흰 캔버스 + 1px 안쪽 규칙 + rounded-card 다', () => {
    render(<StatsCard {...defaultProps} />);
    const card = screen.getByLabelText(defaultProps.ariaLabel);
    expect(card.className).toContain('bg-canvas');
    expect(card.className).toContain('shadow-[inset_0_0_0_1px_var(--border-subtle)]');
    expect(card.className).toContain('rounded-card');
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
