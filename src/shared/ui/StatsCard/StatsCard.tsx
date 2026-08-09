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
  /**
   * 이 카드만 로드에 실패했을 때. 정본 S-11-06 STAT — "카드 하나만 실패하면 값만 `—`로
   * 두고 나머지는 그대로 보여 줍니다." 라벨은 유지하고 값과 델타만 교체한다.
   */
  failed?: boolean;
};

const FAILED_VALUE = '—';
const FAILED_DELTA = '불러오지 못했어요';

// LAYOUT-NUMBERS § 카드·데이터 부품 — padding 14, gap 4, value 26px, 라벨/델타 아이콘 13px.
// 숫자는 전부 tabular-nums.
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
