import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HexRadar } from './HexRadar';

const LABELS = ['공감', '유머', '신뢰', '리더', '성실', '센스'];

describe('HexRadar', () => {
  it('renders all six axis labels', () => {
    render(<HexRadar stats={[80, 60, 70, 50, 90, 40]} labels={LABELS} />);
    for (const label of LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders an accessible role and label', () => {
    render(<HexRadar stats={[10, 20, 30, 40, 50, 60]} labels={LABELS} />);
    expect(screen.getByRole('img', { name: '아바타 스탯 레이더' })).toBeInTheDocument();
  });

  it('throws when stats and labels are not length 6', () => {
    expect(() => render(<HexRadar stats={[10, 20]} labels={LABELS} />)).toThrowError(/exactly 6/);
  });

  // 여기서 쓰면 안 되는 토큰 — 옛 시스템 이름이거나 데이터 채움이 아닌 역할이다.
  it('Codex 역할 토큰만 참조한다 (죽은 옛 토큰 없음)', () => {
    const { container } = render(<HexRadar stats={[80, 60, 70, 50, 90, 40]} labels={LABELS} />);
    const svg = container.querySelector('svg');
    const markup = svg?.outerHTML ?? '';
    for (const deadToken of ['--hairline', '--primary)', '--brand)', '--canvas)']) {
      expect(markup).not.toContain(deadToken);
    }
    expect(markup).toContain('var(--border-subtle)');
    expect(markup).toContain('var(--data-fill)');
    expect(markup).toContain('var(--text-secondary)');
  });
});
