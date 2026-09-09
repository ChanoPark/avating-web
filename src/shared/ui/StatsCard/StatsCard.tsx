import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';

type DeltaTone = 'positive' | 'negative' | 'neutral';

// delta 는 액션이 아니라 보고된 수다 — 파랑도 초록도 아니다.
// 정본(.cx-stat__delta--up)은 상승분만 굵기를 올리지만, 세 카드가 한 줄에 나란히 서면
// 굵기 차이가 순위처럼 읽혀서 전부 같은 무채색 pill 로 통일했다 (사용자 결정 2026-09-09).
// tone 은 호출부의 데이터 계약이라 유지하되 시각에는 반영하지 않는다.
const DELTA_PILL = 'bg-raised text-secondary';

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
        className="bg-canvas rounded-card flex flex-col gap-1 p-5 shadow-[inset_0_0_0_1px_var(--border-subtle)]"
      >
        <div className="flex items-center gap-2">
          <Icon
            size={13}
            strokeWidth={1.5}
            className="text-secondary shrink-0"
            aria-hidden="true"
          />
          <span className="text-label text-muted uppercase">{label}</span>
        </div>
        <div className="text-figure text-secondary tnum font-bold">{FAILED_VALUE}</div>
        <div className="text-meta text-danger">{FAILED_DELTA}</div>
      </div>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      className="bg-canvas rounded-card flex flex-col gap-1 p-5 shadow-[inset_0_0_0_1px_var(--border-subtle)]"
    >
      <div className="flex items-center gap-2">
        <Icon size={13} strokeWidth={1.5} className="text-secondary shrink-0" aria-hidden="true" />
        <span className="text-label text-muted uppercase">{label}</span>
      </div>
      <div className="text-figure text-ink tnum font-bold">{value}</div>
      {delta !== undefined && (
        <div
          className={cn(
            'text-caption tnum inline-flex h-5 w-fit items-center rounded-full px-2 leading-5 font-medium',
            DELTA_PILL
          )}
        >
          {delta.text}
        </div>
      )}
    </div>
  );
}
