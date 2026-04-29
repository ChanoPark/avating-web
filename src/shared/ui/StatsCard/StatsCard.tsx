import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';

type DeltaTone = 'positive' | 'negative' | 'neutral';

const toneClass: Record<DeltaTone, string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-text-3',
};

type StatsCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: { text: string; tone: DeltaTone };
  ariaLabel: string;
};

export function StatsCard({ icon: Icon, label, value, delta, ariaLabel }: StatsCardProps) {
  return (
    <div aria-label={ariaLabel} className="border-border bg-bg-elev-2 rounded-md border p-5">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-text-3" aria-hidden="true" />
        <span className="text-mono-meta text-text-3 font-mono uppercase">{label}</span>
      </div>
      <div className="text-title text-text mt-3">{value}</div>
      {delta !== undefined && (
        <div className={cn('text-mono-meta mt-1 font-mono', toneClass[delta.tone])}>
          {delta.text}
        </div>
      )}
    </div>
  );
}
