import { cn } from '@shared/lib/cn';

const BUBBLE_WIDTHS = ['w-64', 'w-80', 'w-56'];

export function WatchSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex min-h-0 flex-1 animate-pulse flex-col">
      <span className="sr-only">대화를 불러오는 중…</span>
      <div className="border-subtle flex h-16 shrink-0 items-center gap-3 border-b px-6">
        <span className="bg-raised size-10 shrink-0 rounded-full" />
        <span className="bg-raised rounded-chip h-5 w-40" />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-4 px-6 pt-5 pb-3">
        {BUBBLE_WIDTHS.map((width) => (
          <div key={width} className="flex items-start gap-3">
            <span className="bg-raised size-8 shrink-0 rounded-full" />
            <span className={cn('bg-raised h-10.5 max-w-full rounded-[16px]', width)} />
          </div>
        ))}
      </div>
    </div>
  );
}
