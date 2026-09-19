// 반지름 범위 — 좁아도 라벨이 읽히는 하한, 넓어도 카드가 우측 열보다 과하게 길어지지 않는 상한.
const MIN_RADIUS = 64;
const MAX_RADIUS = 120;
const DEFAULT_RADIUS = 84;
// 축 라벨은 정본 .cx-radar__axis 의 12px. 라벨이 꼭짓점과 겹치지 않게 반지름 밖으로 띄운다.
export const AXIS_FONT_SIZE = 12;
export const LABEL_GAP = 10;
const EDGE_PAD = 4;

export type Point = { x: number; y: number };
export type Bounds = { minX: number; maxX: number; minY: number; maxY: number };
type Anchor = 'start' | 'middle' | 'end';

// 12시에서 시작해 시계 방향으로 돈다. 축 수가 홀수면 아래쪽은 꼭짓점이 된다.
export function angleAt(i: number, n: number): number {
  return Math.PI / 2 - (2 * Math.PI * i) / n;
}

// 중심을 원점에 둔 좌표 — 상자는 라벨까지 잰 뒤 viewBox 로 잡는다.
export function point(r: number, angle: number): Point {
  return { x: r * Math.cos(angle), y: -r * Math.sin(angle) };
}

export function buildPath(r: number, fracs: number[]): string {
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
export function estimateTextWidth(text: string, fontSize: number): number {
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
export function layoutFor(
  labels: string[],
  r: number
): { axisLabels: AxisLabel[]; bounds: Bounds } {
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

export function fitRadius(labels: string[], maxWidth: number | undefined): number {
  if (maxWidth === undefined) return DEFAULT_RADIUS;
  for (let r = MAX_RADIUS; r > MIN_RADIUS; r -= 1) {
    const { bounds } = layoutFor(labels, r);
    if (bounds.maxX - bounds.minX <= maxWidth) return r;
  }
  return MIN_RADIUS;
}

/** 그리기 전에 상자 크기를 안다 — 스켈레톤이 실제 레이더와 같은 상자를 세울 때 쓴다. */
export function statRadarBox(
  labels: string[],
  maxWidth?: number
): { width: number; height: number } {
  const { bounds } = layoutFor(labels, fitRadius(labels, maxWidth));
  return { width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY };
}

// 축 i 를 가운데 두고 이웃 축과의 중간선까지 벌린 부채꼴 — 값이 0 이라 꼭짓점이 중심에 몰려도 축을 골라 짚을 수 있다.
export function sectorPath(i: number, n: number, r: number): string {
  const angle = angleAt(i, n);
  const half = Math.PI / n;
  const pts = [point(r, angle + half), point(r, angle), point(r, angle - half)];
  return `M 0 0 ${pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} Z`;
}
