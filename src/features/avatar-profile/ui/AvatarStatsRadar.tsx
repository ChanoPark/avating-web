import { HexRadar } from '@shared/ui/HexRadar/HexRadar';
import { Meter } from '@shared/ui/Meter';
import { AVATAR_STAT_KEYS, AVATAR_STAT_LABELS, type AvatarStats } from '@entities/avatar';

type Props = {
  stats: AvatarStats;
};

export function AvatarStatsRadar({ stats }: Props) {
  const values = AVATAR_STAT_KEYS.map((key) => stats[key]);
  const shortLabels = AVATAR_STAT_KEYS.map((key) => AVATAR_STAT_LABELS[key].short);

  return (
    <section
      aria-labelledby="avatar-stats-heading"
      className="border-border bg-bg-elev-1 rounded-md border p-4"
    >
      <h3 id="avatar-stats-heading" className="text-mono-micro text-text-3 font-mono uppercase">
        아바타 스탯
      </h3>
      <div className="mt-3 flex flex-col items-center gap-4 md:flex-row md:items-center">
        <div className="flex-shrink-0">
          <HexRadar stats={values} labels={shortLabels} size={140} />
        </div>
        <ul className="flex-1 space-y-2 self-stretch">
          {AVATAR_STAT_KEYS.map((key) => {
            const value = stats[key];
            const longLabel = AVATAR_STAT_LABELS[key].long;
            return (
              <li key={key} className="flex items-center gap-3">
                <span className="text-mono-meta text-text-2 w-14 font-mono">{longLabel}</span>
                <Meter value={value} label={longLabel} className="flex-1" />
                <span className="text-mono-meta text-text w-6 text-right font-mono tabular-nums">
                  {value}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
