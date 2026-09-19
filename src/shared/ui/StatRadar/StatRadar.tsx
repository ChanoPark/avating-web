import { useState } from 'react';

type StatRadarProps = {
  stats: number[];
  labels: string[];
  /** 라벨까지 포함한 상자가 이 폭을 넘지 않는 가장 큰 크기로 그린다. 없으면 기본 반지름. */
  maxWidth?: number;
};

/** 다각형이 되는 최소 축 수 — 이보다 적으면 소비처가 값 표만 보여준다. */
export const STAT_RADAR_MIN_AXES = 3;

const GRID_LEVELS = [0.33, 0.66, 1.0] as const;
// 반지름 범위 — 좁아도 라벨이 읽히는 하한, 넓어도 카드가 우측 열보다 과하게 길어지지 않는 상한.
const MIN_RADIUS = 64;
const MAX_RADIUS = 120;
const DEFAULT_RADIUS = 84;
// 축 라벨은 정본 .cx-radar__axis 의 12px. 라벨이 꼭짓점과 겹치지 않게 반지름 밖으로 띄운다.
const AXIS_FONT_SIZE = 12;
const LABEL_GAP = 10;
const EDGE_PAD = 4;
// 툴팁은 정본 값이 로컬에 없어(Tooltip 미임포트) 칩 반경 6 · 12px · 잉크 채움으로 둔다.
const TOOLTIP_FONT_SIZE = 12;
const TOOLTIP_PAD_X = 8;
const TOOLTIP_HEIGHT = 22;
const TOOLTIP_RADIUS = 6;
const TOOLTIP_OFFSET = 8;

type Point = { x: number; y: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };
type Anchor = 'start' | 'middle' | 'end';

// 12시에서 시작해 시계 방향으로 돈다. 축 수가 홀수면 아래쪽은 꼭짓점이 된다.
function angleAt(i: number, n: number): number {
  return Math.PI / 2 - (2 * Math.PI * i) / n;
}

// 중심을 원점에 둔 좌표 — 상자는 라벨까지 잰 뒤 viewBox 로 잡는다.
function point(r: number, angle: number): Point {
  return { x: r * Math.cos(angle), y: -r * Math.sin(angle) };
}

function buildPath(r: number, fracs: number[]): string {
  return (
    fracs
      .map((frac, i) => {
        const p = point(r * frac, angleAt(i, fracs.length));
        return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
}

// 좌우에 놓이는 라벨은 꼭짓점 쪽 끝을 기준으로 정렬해야 다각형을 덮지 않는다.
function textAnchorAt(angle: number): Anchor {
  const cos = Math.cos(angle);
  if (Math.abs(cos) < 0.2) return 'middle';
  return cos > 0 ? 'start' : 'end';
}

// SVG 글자 폭은 렌더 전에 잴 수 없어 어림한다 — 한글은 1em, 그 밖은 0.6em. 상자가 라벨보다 작아 잘리는 것만 막으면 된다.
function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) {
    width += /[ㄱ-힝]/.test(ch) ? fontSize : fontSize * 0.6;
  }
  return width;
}

function labelBounds(p: Point, width: number, anchor: Anchor): Bounds {
  const minX = anchor === 'start' ? p.x : anchor === 'end' ? p.x - width : p.x - width / 2;
  return {
    minX,
    maxX: minX + width,
    minY: p.y - AXIS_FONT_SIZE / 2,
    maxY: p.y + AXIS_FONT_SIZE / 2,
  };
}

function union(a: Bounds, b: Bounds): Bounds {
  return {
    minX: Math.min(a.minX, b.minX),
    maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

type AxisLabel = { label: string; p: Point; anchor: Anchor; width: number };

// 반지름 r 에서 라벨 자리와, 라벨까지 감싸는 상자를 잰다.
function layoutFor(labels: string[], r: number): { axisLabels: AxisLabel[]; bounds: Bounds } {
  const n = labels.length;
  const axisLabels = labels.map((label, i) => {
    const angle = angleAt(i, n);
    return {
      label,
      p: point(r + LABEL_GAP, angle),
      anchor: textAnchorAt(angle),
      width: estimateTextWidth(label, AXIS_FONT_SIZE),
    };
  });
  const ring: Bounds = { minX: -r, maxX: r, minY: -r, maxY: r };
  const content = axisLabels.reduce(
    (acc, { p, width, anchor }) => union(acc, labelBounds(p, width, anchor)),
    ring
  );
  return {
    axisLabels,
    bounds: {
      minX: content.minX - EDGE_PAD,
      maxX: content.maxX + EDGE_PAD,
      minY: content.minY - EDGE_PAD,
      maxY: content.maxY + EDGE_PAD,
    },
  };
}

function fitRadius(labels: string[], maxWidth: number | undefined): number {
  if (maxWidth === undefined) return DEFAULT_RADIUS;
  for (let r = MAX_RADIUS; r > MIN_RADIUS; r -= 1) {
    const { bounds } = layoutFor(labels, r);
    if (bounds.maxX - bounds.minX <= maxWidth) return r;
  }
  return MIN_RADIUS;
}

// 축 i 를 가운데 두고 이웃 축과의 중간선까지 벌린 부채꼴 — 값이 0 이라 꼭짓점이 중심에 몰려도 축을 골라 짚을 수 있다.
function sectorPath(i: number, n: number, r: number): string {
  const angle = angleAt(i, n);
  const half = Math.PI / n;
  const pts = [point(r, angle + half), point(r, angle), point(r, angle - half)];
  return `M 0 0 ${pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} Z`;
}

// 꼭짓점에서 중심 쪽으로 띄우되, 상자 모서리가 격자 바깥(축 라벨 자리)으로 나가지 않을 만큼 더 안쪽으로 당긴다.
// 바깥쪽에 띄우면 값이 큰 축에서 그 축의 라벨을 가린다.
function tooltipCenter(dist: number, angle: number, halfW: number, r: number): Point {
  const halfH = TOOLTIP_HEIGHT / 2;
  for (let c = dist - TOOLTIP_OFFSET - halfH; c >= 0; c -= 1) {
    const p = point(c, angle);
    if (Math.hypot(Math.abs(p.x) + halfW, Math.abs(p.y) + halfH) <= r) return p;
  }
  // 중심 가까운 꼭짓점은 안쪽 자리가 없다 — 위로 띄워도 격자 안이다.
  const v = point(dist, angle);
  return { x: v.x, y: v.y - TOOLTIP_OFFSET - halfH };
}

type TooltipProps = { text: string; dist: number; angle: number; r: number; bounds: Bounds };

function Tooltip({ text, dist, angle, r, bounds }: TooltipProps) {
  const width = estimateTextWidth(text, TOOLTIP_FONT_SIZE) + TOOLTIP_PAD_X * 2;
  const center = tooltipCenter(dist, angle, width / 2, r);
  const x = Math.min(Math.max(center.x - width / 2, bounds.minX), bounds.maxX - width);
  const y = Math.min(
    Math.max(center.y - TOOLTIP_HEIGHT / 2, bounds.minY),
    bounds.maxY - TOOLTIP_HEIGHT
  );
  return (
    <g data-testid="stat-radar-tooltip" pointerEvents="none">
      <rect
        x={x}
        y={y}
        width={width}
        height={TOOLTIP_HEIGHT}
        rx={TOOLTIP_RADIUS}
        fill="var(--ink)"
      />
      <text
        x={x + width / 2}
        y={y + TOOLTIP_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={TOOLTIP_FONT_SIZE}
        fill="var(--text-on-ink)"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {text}
      </text>
    </g>
  );
}

export function StatRadar({ stats, labels, maxWidth }: StatRadarProps) {
  const [active, setActive] = useState<number | null>(null);

  if (stats.length !== labels.length) {
    throw new Error('StatRadar requires stats and labels of the same length.');
  }
  if (labels.length < STAT_RADAR_MIN_AXES) {
    throw new Error(`StatRadar requires at least ${STAT_RADAR_MIN_AXES.toString()} axes.`);
  }
  const n = labels.length;
  const r = fitRadius(labels, maxWidth);
  const dataFracs = stats.map((v) => Math.max(0, Math.min(100, v)) / 100);
  const { axisLabels, bounds } = layoutFor(labels, r);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  const activeStat = active === null ? undefined : stats[active];
  const activeLabel = active === null ? undefined : labels[active];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${bounds.minX.toFixed(1)} ${bounds.minY.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)}`}
      overflow="visible"
      role="img"
      aria-label="아바타 스탯 레이더"
    >
      {GRID_LEVELS.map((frac, gi) => (
        <path
          key={gi}
          d={buildPath(r, Array<number>(n).fill(frac))}
          fill="none"
          stroke="var(--data-grid)"
          strokeWidth={0.8}
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const p = point(r, angleAt(i, n));
        return (
          <line
            key={i}
            x1={0}
            y1={0}
            x2={p.x}
            y2={p.y}
            stroke="var(--data-grid)"
            strokeWidth={0.8}
          />
        );
      })}
      {/* 반투명 채움이라 아래 그리드가 비쳐 보인다 — 불투명 wash 를 쓰면 격자가 가려진다. */}
      <path
        d={buildPath(r, dataFracs)}
        fill="var(--data-fill)"
        fillOpacity={0.15}
        stroke="var(--data-fill)"
        strokeWidth={1.5}
      />
      {dataFracs.map((frac, i) => {
        const p = point(r * frac, angleAt(i, n));
        return (
          <circle key={i} cx={p.x} cy={p.y} r={i === active ? 4 : 2.5} fill="var(--data-fill)" />
        );
      })}
      {axisLabels.map(({ label, p, anchor }, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          textAnchor={anchor}
          dominantBaseline="middle"
          fontSize={AXIS_FONT_SIZE}
          fill="var(--data-axis-text)"
        >
          {label}
        </text>
      ))}
      {/* 값은 옆 값 표가 늘 보여준다 — hover 툴팁은 마우스 사용자를 위한 보조라 포커스 대상을 늘리지 않는다. */}
      {Array.from({ length: n }, (_, i) => (
        <path
          key={i}
          data-axis={i}
          d={sectorPath(i, n, r + LABEL_GAP)}
          fill="transparent"
          onMouseEnter={() => {
            setActive(i);
          }}
          onMouseLeave={() => {
            setActive(null);
          }}
        />
      ))}
      {active !== null && activeStat !== undefined && activeLabel !== undefined && (
        <Tooltip
          text={`${activeLabel} ${Math.round(activeStat).toString()}`}
          dist={r * (dataFracs[active] ?? 0)}
          angle={angleAt(active, n)}
          r={r}
          bounds={bounds}
        />
      )}
    </svg>
  );
}
