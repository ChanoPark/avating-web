import { StatRadar, STAT_RADAR_MIN_AXES, statRadarBox } from '@shared/ui/StatRadar';
import { cn } from '@shared/lib/cn';
import { useElementWidth } from '@shared/lib/useElementWidth';
import { PERSONA_STAT_KEYS, personaStatRows, type PersonaStatRow } from '../model';

// 감싸는 카드가 @container 여야 한다 — 카드가 넓으면(컨테이너 ≥ 384px) 정본(.cx-radar · .wf2-radarrow gap 28)대로
// 레이더 옆에 값 표, 좁으면(lg 폭 300 카드·모바일) 위아래로 쌓는다. 스켈레톤도 같은 규칙을 따라야 로드 순간 상자가 같다.
// 레이더를 크게 보이려고(사용자 요청 2026-09-19) 남는 폭은 레이더 칸이 갖고, 값 표는 128px 로 둔다.
const PERSONA_STATS_CLASS = {
  layout: 'flex flex-col items-center gap-3 @sm:flex-row @sm:gap-7',
  radarCell: 'flex w-full min-w-0 justify-center @sm:flex-1',
  table: 'w-full @sm:w-32 @sm:shrink-0',
} as const;

// 정본(S-03-01 · S-02-06)은 StatRadar 6축 + 값 표지만, 서버가 주는 PersonaStatType 7지표를 그대로 그린다(사용자 결정 2026-09-19).
// 형태만으로 값을 전하지 않으므로 값 표는 항상 둔다.
// 표 라벨은 정본(.cx-radar__table th)의 --text-muted 대신 secondary 다 — muted 는 3.93:1 로 AA 미달이라
// 읽어야 하는 글자에 쓰지 않는다(axe 게이트). 레이더 축 라벨은 정본대로 muted 다.
export function PersonaStats({ rows }: { rows: PersonaStatRow[] }) {
  // 레이더 칸의 실제 폭에 맞춰 반지름을 고른다 — 카드가 넓을수록 레이더가 커진다.
  const [radarCellRef, radarCellWidth] = useElementWidth<HTMLDivElement>();
  const hasRadar = rows.length >= STAT_RADAR_MIN_AXES;
  return (
    <div className={PERSONA_STATS_CLASS.layout}>
      {hasRadar && (
        <div ref={radarCellRef} className={PERSONA_STATS_CLASS.radarCell}>
          <StatRadar
            stats={rows.map((row) => row.value)}
            labels={rows.map((row) => row.label)}
            {...(radarCellWidth > 0 ? { maxWidth: radarCellWidth } : {})}
          />
        </div>
      )}
      <table className={cn('border-collapse', hasRadar ? PERSONA_STATS_CLASS.table : 'w-full')}>
        <caption className="sr-only">성향 지표</caption>
        <tbody>
          {rows.map(({ key, label, value }) => (
            <tr key={key}>
              <th scope="row" className="text-meta text-secondary py-0.75 text-left font-normal">
                {label}
              </th>
              <td className="text-caption text-primary tnum py-0.75 pl-4 text-right">
                {Math.round(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 7지표 전부를 가정한 레이더 라벨 — 스켈레톤이 실제 레이더와 같은 계산(statRadarBox)으로 상자를 세운다.
const SKELETON_RADAR_LABELS = personaStatRows(
  Object.fromEntries(PERSONA_STAT_KEYS.map((key) => [key, 0]))
).map((row) => row.label);

function RadarSkeleton() {
  const [cellRef, cellWidth] = useElementWidth<HTMLDivElement>();
  const box = statRadarBox(SKELETON_RADAR_LABELS, cellWidth > 0 ? cellWidth : undefined);
  return (
    <div ref={cellRef} className={PERSONA_STATS_CLASS.radarCell}>
      <svg
        data-testid="stat-radar-skeleton"
        aria-hidden="true"
        width={box.width}
        height={box.height}
      >
        <circle
          cx={box.width / 2}
          cy={box.height / 2}
          r={Math.min(box.width, box.height) / 2}
          fill="var(--bg-raised)"
        />
      </svg>
    </div>
  );
}

/** PersonaStats 의 로딩 골격 — 레이더(실제와 같은 상자) · 지표 7행(행당 25px). 감싸는 카드가 @container 여야 한다. */
export function PersonaStatsSkeleton() {
  return (
    <div className={PERSONA_STATS_CLASS.layout}>
      <RadarSkeleton />
      <div className={cn('flex flex-col', PERSONA_STATS_CLASS.table)}>
        {PERSONA_STAT_KEYS.map((key) => (
          <div key={key} className="flex h-6.25 items-center justify-between">
            <div className="bg-raised rounded-chip h-3 w-12" />
            <div className="bg-raised rounded-chip h-3 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
