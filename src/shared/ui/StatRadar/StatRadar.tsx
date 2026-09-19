type StatRadarProps = {
  stats: number[];
  labels: string[];
  size?: number;
};

/** 다각형이 되는 최소 축 수 — 이보다 적으면 소비처가 값 표만 보여준다. */
export const STAT_RADAR_MIN_AXES = 3;

const GRID_LEVELS = [0.33, 0.66, 1.0] as const;
// 축 라벨은 정본 .cx-radar__axis 의 12px. 라벨이 꼭짓점과 겹치지 않게 반지름 밖으로 띄운다.
const AXIS_FONT_SIZE = 12;
const LABEL_GAP = 10;
// 좌우 라벨이 네모 상자 밖으로 조금 나가도 되도록 반지름을 상자의 0.34 로 둔다 (정본 .cx-radar__plot{overflow:visible}).
const RADIUS_RATIO = 0.34;

// 12시에서 시작해 시계 방향으로 돈다. 축 수가 홀수면 아래쪽은 꼭짓점이 된다.
function angleAt(i: number, n: number): number {
  return Math.PI / 2 - (2 * Math.PI * i) / n;
}

function point(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
}

function buildPath(cx: number, cy: number, r: number, fracs: number[]): string {
  return (
    fracs
      .map((frac, i) => {
        const p = point(cx, cy, r * frac, angleAt(i, fracs.length));
        return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
}

// 좌우에 놓이는 라벨은 꼭짓점 쪽 끝을 기준으로 정렬해야 다각형을 덮지 않는다.
function textAnchorAt(angle: number): 'start' | 'middle' | 'end' {
  const cos = Math.cos(angle);
  if (Math.abs(cos) < 0.2) return 'middle';
  return cos > 0 ? 'start' : 'end';
}

export function StatRadar({ stats, labels, size = 176 }: StatRadarProps) {
  if (stats.length !== labels.length) {
    throw new Error('StatRadar requires stats and labels of the same length.');
  }
  if (labels.length < STAT_RADAR_MIN_AXES) {
    throw new Error(`StatRadar requires at least ${STAT_RADAR_MIN_AXES.toString()} axes.`);
  }
  const n = labels.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * RADIUS_RATIO;

  const dataFracs = stats.map((v) => Math.max(0, Math.min(100, v)) / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size.toString()} ${size.toString()}`}
      overflow="visible"
      role="img"
      aria-label="아바타 스탯 레이더"
    >
      {GRID_LEVELS.map((frac, gi) => (
        <path
          key={gi}
          d={buildPath(cx, cy, r, Array<number>(n).fill(frac))}
          fill="none"
          stroke="var(--data-grid)"
          strokeWidth={0.8}
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const p = point(cx, cy, r, angleAt(i, n));
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="var(--data-grid)"
            strokeWidth={0.8}
          />
        );
      })}
      {/* 반투명 채움이라 아래 그리드가 비쳐 보인다 — 불투명 wash 를 쓰면 격자가 가려진다. */}
      <path
        d={buildPath(cx, cy, r, dataFracs)}
        fill="var(--data-fill)"
        fillOpacity={0.15}
        stroke="var(--data-fill)"
        strokeWidth={1.5}
      />
      {dataFracs.map((frac, i) => {
        const p = point(cx, cy, r * frac, angleAt(i, n));
        return <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--data-fill)" />;
      })}
      {labels.map((label, i) => {
        const angle = angleAt(i, n);
        const p = point(cx, cy, r + LABEL_GAP, angle);
        return (
          <text
            key={label}
            x={p.x}
            y={p.y}
            textAnchor={textAnchorAt(angle)}
            dominantBaseline="middle"
            fontSize={AXIS_FONT_SIZE}
            fill="var(--data-axis-text)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
