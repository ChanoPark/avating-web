import { cn } from '@shared/lib/cn';

type MeterProps = {
  value: number;
  label?: string;
  className?: string;
};

// `.cx-progress` — 막대엔 타입이 얹히지 않으므로 --data-fill(밝은 쪽 파랑)을 쓴다.
// tone 별 색 구분은 없다: Codex 에 success·warning 색이 없고, 한계 도달만 danger 로 나뉜다.
export function Meter({ value, label, className }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('bg-data-track h-1.5 w-full overflow-hidden rounded-full', className)}
    >
      <div
        className="bg-data-fill h-full rounded-full transition-[width] duration-[var(--dur-slow)] ease-out"
        style={{ width: `${String(clamped)}%` }}
      />
    </div>
  );
}
