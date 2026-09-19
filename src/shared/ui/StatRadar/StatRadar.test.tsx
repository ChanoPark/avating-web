import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatRadar } from './StatRadar';

// 서버 PersonaStatType 7지표 — 축 수는 고정이 아니라 넘긴 라벨 수를 따른다.
const LABELS = ['개방성', '상상력', '외향성', '공감', '계획성', '유머', '애정표현'];
const STATS = [72.5, 68, 80, 65, 45, 88, 55];

function dataPath(container: HTMLElement) {
  return container.querySelector('path[fill="var(--data-fill)"]');
}

// "M x y L x y ... Z" 에서 꼭짓점 수를 센다.
function vertexCount(d: string | null | undefined) {
  return (d ?? '').match(/[ML]/g)?.length ?? 0;
}

describe('StatRadar', () => {
  it('넘긴 라벨 수만큼 축 라벨을 그린다 (7축)', () => {
    render(<StatRadar stats={STATS} labels={LABELS} />);
    for (const label of LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('데이터 다각형의 꼭짓점 수가 축 수와 같다', () => {
    const { container } = render(<StatRadar stats={STATS} labels={LABELS} />);
    expect(vertexCount(dataPath(container)?.getAttribute('d'))).toBe(7);
  });

  it('3축도 그린다 — 다각형이 되는 최소 축 수', () => {
    const { container } = render(
      <StatRadar stats={[10, 50, 90]} labels={['공감', '유머', '계획성']} />
    );
    expect(vertexCount(dataPath(container)?.getAttribute('d'))).toBe(3);
  });

  it('접근 가능한 이름을 가진 img 로 노출된다', () => {
    render(<StatRadar stats={STATS} labels={LABELS} />);
    expect(screen.getByRole('img', { name: '아바타 스탯 레이더' })).toBeInTheDocument();
  });

  it('stats 와 labels 길이가 다르면 던진다', () => {
    expect(() => render(<StatRadar stats={[10, 20]} labels={LABELS} />)).toThrowError(
      /same length/
    );
  });

  it('축이 3개 미만이면 던진다 — 다각형이 되지 않는다', () => {
    expect(() => render(<StatRadar stats={[10, 20]} labels={['공감', '유머']} />)).toThrowError(
      /at least 3/
    );
  });

  // 정본 .cx-radar__axis(12px, --text-muted) · 데이터 토큰(--data-grid / --data-fill / --data-axis-text).
  it('Codex 데이터 시각화 토큰만 참조한다', () => {
    const { container } = render(<StatRadar stats={STATS} labels={LABELS} />);
    const markup = container.querySelector('svg')?.outerHTML ?? '';
    for (const deadToken of ['--hairline', '--primary)', '--brand)', '--canvas)']) {
      expect(markup).not.toContain(deadToken);
    }
    expect(markup).toContain('var(--data-grid)');
    expect(markup).toContain('var(--data-fill)');
    expect(markup).toContain('var(--data-axis-text)');
    expect(screen.getByText('애정표현')).toHaveAttribute('font-size', '12');
  });
});
