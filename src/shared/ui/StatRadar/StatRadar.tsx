import { useState } from 'react';
import {
  AXIS_FONT_SIZE,
  LABEL_GAP,
  angleAt,
  buildPath,
  estimateTextWidth,
  fitRadius,
  layoutFor,
  point,
  sectorPath,
} from './geometry';
import type { Bounds, Point } from './geometry';

type StatRadarProps = {
  stats: number[];
  labels: string[];
  /** 라벨까지 포함한 상자가 이 폭을 넘지 않는 가장 큰 크기로 그린다. 없으면 기본 반지름. */
  maxWidth?: number;
};

/** 다각형이 되는 최소 축 수 — 이보다 적으면 소비처가 값 표만 보여준다. */
export const STAT_RADAR_MIN_AXES = 3;

const GRID_LEVELS = [0.33, 0.66, 1.0] as const;
// 툴팁은 정본 .cx-tip__bubble(_ds/components/cx-components.css) — 13px · line-height 1.4 · padding 4/8 ·
// radius chip · 잉크 채움, 트리거와 6px. 정본은 트리거 바깥에 띄우지만 여기서는 격자 안쪽에 띄운다(tooltipCenter).
const TOOLTIP_FONT_SIZE = 13;
const TOOLTIP_LINE_HEIGHT = 1.4;
const TOOLTIP_PAD_X = 8;
const TOOLTIP_PAD_Y = 4;
const TOOLTIP_HEIGHT = TOOLTIP_PAD_Y * 2 + TOOLTIP_FONT_SIZE * TOOLTIP_LINE_HEIGHT;
const TOOLTIP_RADIUS = 6;
const TOOLTIP_OFFSET = 6;

// 꼭짓점에서 중심 쪽으로 띄우되, 상자 모서리가 격자 바깥(축 라벨 자리)으로 나가지 않을 만큼 더 안쪽으로 당긴다.
// 바깥쪽에 띄우면 값이 큰 축에서 그 축의 라벨을 가린다. 시작 거리는 상자가 축 방향으로 차지하는 길이
// (halfW·|cos| + halfH·|sin|)만큼 빼야 가로 방향 축에서도 가리키는 꼭짓점을 덮지 않는다.
function tooltipCenter(dist: number, angle: number, halfW: number, r: number): Point {
  const halfH = TOOLTIP_HEIGHT / 2;
  const reach = halfW * Math.abs(Math.cos(angle)) + halfH * Math.abs(Math.sin(angle));
  for (let c = dist - TOOLTIP_OFFSET - reach; c >= 0; c -= 1) {
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
