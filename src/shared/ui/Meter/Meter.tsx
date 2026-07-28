import { cn } from '@shared/lib/cn';

type MeterProps = {
  // 0–100 사이 정수 값. 범위를 벗어나면 clamp.
  value: number;
  // 접근성 라벨. 시각적으로 라벨이 보이면 caller 가 `aria-labelledby` 를 직접 줘도 됨.
  label?: string;
  // tone — 향후 호감도 임계값별 색 차이 (현 v1 은 brand 단일).
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
};

const toneClass = {
  brand: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

export function Meter({ value, label, tone = 'brand', className }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
      className={cn('bg-canvas-soft h-1.5 w-full overflow-hidden rounded-full', className)}
    >
      <div
        className={cn('h-full rounded-full', toneClass[tone])}
        style={{ width: `${String(clamped)}%` }}
      />
    </div>
  );
}
