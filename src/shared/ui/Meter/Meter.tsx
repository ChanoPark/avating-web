import { cn } from '@shared/lib/cn';

type MeterProps = {
  value: number;
  label?: string;
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
