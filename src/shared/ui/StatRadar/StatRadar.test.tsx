import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  describe('hover 툴팁', () => {
    function sector(container: HTMLElement, axis: number) {
      const el = container.querySelector(`[data-axis="${axis.toString()}"]`);
      if (el === null) throw new Error(`axis ${axis.toString()} sector not found`);
      return el;
    }

    it('축마다 hover 영역이 하나씩 있다', () => {
      const { container } = render(<StatRadar stats={STATS} labels={LABELS} />);
      expect(container.querySelectorAll('[data-axis]')).toHaveLength(7);
    });

    it('축 영역에 마우스를 올리면 그 지표 이름과 반올림한 값을 보여주고, 내리면 숨긴다', async () => {
      const user = userEvent.setup();
      const { container } = render(<StatRadar stats={STATS} labels={LABELS} />);
      expect(screen.queryByTestId('stat-radar-tooltip')).not.toBeInTheDocument();

      await user.hover(sector(container, 0));
      expect(screen.getByTestId('stat-radar-tooltip')).toHaveTextContent('개방성 73');

      await user.unhover(sector(container, 0));
      expect(screen.queryByTestId('stat-radar-tooltip')).not.toBeInTheDocument();
    });

    it('다른 축으로 옮기면 그 축의 값으로 바뀐다', async () => {
      const user = userEvent.setup();
      const { container } = render(<StatRadar stats={STATS} labels={LABELS} />);

      await user.hover(sector(container, 0));
      await user.hover(sector(container, 5));
      expect(screen.getByTestId('stat-radar-tooltip')).toHaveTextContent('유머 88');
    });
  });

  describe('폭에 맞춘 크기', () => {
    function svgWidth(container: HTMLElement) {
      return Number(container.querySelector('svg')?.getAttribute('width'));
    }
    function renderWidth(maxWidth?: number) {
      const { container, unmount } = render(
        <StatRadar
          stats={STATS}
          labels={LABELS}
          {...(maxWidth === undefined ? {} : { maxWidth })}
        />
      );
      const width = svgWidth(container);
      unmount();
      return width;
    }

    it('라벨까지 포함한 상자가 maxWidth 를 넘지 않는 가장 큰 크기로 그린다', () => {
      expect(renderWidth(260)).toBeLessThanOrEqual(260);
      expect(renderWidth(260)).toBeGreaterThan(240);
    });

    it('폭이 넓을수록 커지지만 상한에서 멈춘다', () => {
      expect(renderWidth(320)).toBeGreaterThan(renderWidth(260));
      expect(renderWidth(2000)).toBe(renderWidth(3000));
    });

    it('폭이 너무 좁아도 최소 크기 아래로는 줄이지 않는다', () => {
      expect(renderWidth(50)).toBe(renderWidth(10));
      expect(renderWidth(50)).toBeGreaterThan(50);
    });
  });

  // 바깥 꼭짓점 위에 띄우면 그 축 라벨을 가린다 — 꼭짓점보다 중심 쪽에 띄운다.
  it('툴팁은 꼭짓점 바깥(라벨 쪽)이 아니라 중심 쪽에 뜬다 (상상력 축 값 100)', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <StatRadar stats={[50, 100, 50, 50, 50, 50, 50]} labels={LABELS} />
    );
    const d = container.querySelector('path[fill="var(--data-fill)"]')?.getAttribute('d') ?? '';
    // "M x0 y0 L x1 y1 ..." — 두 번째 꼭짓점이 상상력(축 1)이다.
    const vertexY = Number(/L\s+\S+\s+(\S+)/.exec(d)?.[1]);

    const sector = container.querySelector('[data-axis="1"]');
    if (sector === null) throw new Error('axis 1 sector not found');
    await user.hover(sector);

    const rect = screen.getByTestId('stat-radar-tooltip').querySelector('rect');
    // 위쪽 축이라 중심 쪽 = 아래. 툴팁 상단이 꼭짓점보다 위로 올라가지 않는다.
    expect(Number(rect?.getAttribute('y'))).toBeGreaterThanOrEqual(vertexY - 1);
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
