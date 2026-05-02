import type { LucideIcon } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@shared/lib/cn';

type StatBarProps = {
  value: number;
  icon: LucideIcon;
  label: string;
  animate?: boolean;
  className?: string;
};

export function StatBar({ value, icon: Icon, label, animate = true, className }: StatBarProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={14} className="text-brand" aria-hidden="true" />
          <span className="text-mono-meta text-text-2 font-mono">{label}</span>
        </div>
        <span className="text-mono-meta text-text font-mono">{value}</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} ${value} / 100`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-bg-elev-3 h-1.5 w-full overflow-hidden rounded-full"
      >
        <div
          className="bg-brand h-full rounded-full"
          style={{
            width: `${value}%`,
            transitionProperty: 'width',
            transitionDuration: shouldAnimate ? '400ms' : '0s',
            transitionTimingFunction: 'ease-out',
          }}
        />
      </div>
    </div>
  );
}
