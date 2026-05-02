import { cn } from '@shared/lib/cn';

type ProgressBarProps = {
  current: number;
  total: number;
  labels?: readonly string[];
  className?: string;
};

export function ProgressBar({ current, total, labels, className }: ProgressBarProps) {
  const currentLabel = labels?.[current - 1];
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuetext={`${current} / ${total} 단계${currentLabel ? `: ${currentLabel}` : ''}`}
      className={cn('flex gap-1', className)}
    >
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isCurrent = stepNum === current;
        return (
          <div
            key={stepNum}
            className={cn(
              'h-1 flex-1 rounded-full',
              isDone && 'bg-brand',
              isCurrent && 'bg-brand relative overflow-hidden',
              !isDone && !isCurrent && 'bg-bg-elev-3'
            )}
          >
            {isCurrent && (
              <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
          </div>
        );
      })}
    </div>
  );
}
