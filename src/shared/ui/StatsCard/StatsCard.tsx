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
  /** 카드 단위 로드 실패 — 라벨은 유지하고 값·델타만 `—`로 바꾼다(S-11-06 STAT). */
  failed?: boolean;
};

const FAILED_VALUE = '—';
const FAILED_DELTA = '불러오지 못했어요';

export function StatsCard({
  icon: Icon,
  label,
  value,
  delta,
  ariaLabel,
  failed = false,
}: StatsCardProps) {
  if (failed) {
    return (
      <div
        role="alert"
        aria-label={`${label} 불러오지 못했어요`}
        className="border-hairline bg-surface shadow-card flex flex-col gap-1 rounded-lg border p-3.5"
      >
        <div className="flex items-center gap-2">
          <Icon size={13} strokeWidth={1.5} className="text-ink-mute shrink-0" aria-hidden="true" />
          <span className="text-micro-cap text-ink-mute uppercase">{label}</span>
        </div>
        <div className="text-display-md text-ink-mute">{FAILED_VALUE}</div>
        <div className="text-micro text-danger">{FAILED_DELTA}</div>
      </div>
    );
  }

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
