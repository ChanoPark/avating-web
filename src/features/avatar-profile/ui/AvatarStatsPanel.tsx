import { Meter } from '@shared/ui/Meter';
import { AVATAR_STAT_KEYS, AVATAR_STAT_LABELS, type AvatarStats } from '@entities/avatar';

type Props = {
  stats: AvatarStats;
};

// `아바타 스탯` 카드는 StatBar 행만 쌓고, 레이더는 넣지 않는다.
export function AvatarStatsPanel({ stats }: Props) {
  return (
    <section
      aria-labelledby="avatar-stats-heading"
      className="border-subtle bg-canvas rounded-card flex flex-col gap-2.25 border p-4"
    >
      <h3 id="avatar-stats-heading" className="text-caption text-primary font-medium">
        아바타 스탯
      </h3>
      <ul className="flex flex-col gap-2.25">
        {AVATAR_STAT_KEYS.map((key) => {
          const value = stats[key];
          const longLabel = AVATAR_STAT_LABELS[key].long;
          return (
            <li key={key} className="flex items-center gap-2.5">
              <span className="text-meta text-secondary w-18 shrink-0">{longLabel}</span>
              <Meter value={value} label={longLabel} className="flex-1" />
              <span className="text-meta text-primary tnum w-6 shrink-0 text-right">{value}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
