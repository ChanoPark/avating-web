import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';

type DeltaTone = 'positive' | 'negative' | 'neutral';

const toneClass: Record<DeltaTone, string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-ink-mute',
};

type StatsCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: { text: string; tone: DeltaTone };
  ariaLabel: string;
};

// LAYOUT-NUMBERS § 카드·데이터 부품 — padding 14, gap 4, value 26px, 라벨/델타 아이콘 13px.
// 숫자는 전부 tabular-nums.
export function StatsCard({ icon: Icon, label, value, delta, ariaLabel }: StatsCardProps) {
  return (
    <div
      aria-label={ariaLabel}
      className="border-hairline bg-surface shadow-card flex flex-col gap-1 rounded-lg border p-3.5"
    >
      <div className="flex items-center gap-2">
        <Icon size={13} strokeWidth={1.5} className="text-ink-mute shrink-0" aria-hidden="true" />
        <span className="text-micro-cap text-ink-mute uppercase">{label}</span>
      </div>
      <div className="text-display-md text-ink tnum">{value}</div>
      {delta !== undefined && (
        <div className={cn('text-micro tnum', toneClass[delta.tone])}>{delta.text}</div>
      )}
    </div>
  );
}
