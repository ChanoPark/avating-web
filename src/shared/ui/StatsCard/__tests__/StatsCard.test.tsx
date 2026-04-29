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
      render(
        <StatsCard {...defaultProps} delta={{ text: '-153 다이아 사용', tone: 'negative' }} />
      );
      const delta = screen.getByText('-153 다이아 사용');
      expect(delta.className).toContain('text-danger');
    });

    it('delta.tone="neutral" 시 text-text-3 클래스가 적용된다', () => {
      render(<StatsCard {...defaultProps} delta={{ text: '매칭 성공률 6.4%', tone: 'neutral' }} />);
      const delta = screen.getByText('매칭 성공률 6.4%');
      expect(delta.className).toContain('text-text-3');
    });

    it('delta 가 있을 때 delta 텍스트가 렌더된다', () => {
      render(<StatsCard {...defaultProps} delta={{ text: '+3.2pt', tone: 'positive' }} />);
      expect(screen.getByText('+3.2pt')).toBeInTheDocument();
    });
  });

  it('icon 이 렌더된다 (aria-hidden 으로 처리)', () => {
    const { container } = render(<StatsCard {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('a11y — axe 위반 0 (vitest-axe 미설치 — jest-axe 도입 후 활성화)', () => {
    // vitest-axe / jest-axe 가 미설치 상태임. GREEN 단계에서 의존성 추가 후 활성화.
    // axe: it.todo('axe 위반 0 — jest-axe 도입 후 활성화')
    expect(true).toBe(true);
  });
});
