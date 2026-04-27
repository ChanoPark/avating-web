type HexRadarProps = {
  stats: number[];
  labels: string[];
  size?: number;
};

const N = 6;
const GRID_LEVELS = [0.33, 0.66, 1.0] as const;

function angleAt(i: number): number {
  return Math.PI / 2 + ((2 * Math.PI * i) / N) * -1;
}

function point(cx: number, cy: number, r: number, i: number, frac: number) {
  return {
    x: cx + r * frac * Math.cos(angleAt(i)),
    y: cy - r * frac * Math.sin(angleAt(i)),
  };
}

function buildPath(cx: number, cy: number, r: number, fracs: number[]): string {
  return (
    fracs
      .map((frac, i) => {
        const p = point(cx, cy, r, i, frac);
        return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
}

export function HexRadar({ stats, labels, size = 160 }: HexRadarProps) {
  if (stats.length !== N || labels.length !== N) {
    throw new Error('HexRadar requires exactly 6 stats and 6 labels.');
  }
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  const dataFracs = stats.map((v) => Math.max(0, Math.min(100, v)) / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size.toString()} ${size.toString()}`}
      role="img"
      aria-label="아바타 스탯 레이더"
    >
      {GRID_LEVELS.map((frac, gi) => (
        <path
          key={gi}
          d={buildPath(cx, cy, r, Array<number>(N).fill(frac))}
          fill="none"
          stroke="var(--border)"
          strokeWidth={0.8}
        />
      ))}
      {Array.from({ length: N }, (_, i) => {
        const p = point(cx, cy, r, i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="var(--border)"
            strokeWidth={0.8}
          />
        );
      })}
      <path
        d={buildPath(cx, cy, r, dataFracs)}
        fill="rgba(81,112,255,0.15)"
        stroke="var(--brand)"
        strokeWidth={1.5}
      />
      {dataFracs.map((frac, i) => {
        const p = point(cx, cy, r, i, frac);
        return <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--brand)" />;
      })}
      {labels.map((label, i) => {
        const p = point(cx, cy, r, i, 1.22);
        return (
          <text
            key={label}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="var(--text-3)"
            fontFamily="var(--font-mono)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
