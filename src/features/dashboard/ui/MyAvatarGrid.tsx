import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Plus } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { Tag } from '@shared/ui/Tag';
import { StatusDot } from '@shared/ui/StatusDot';
import { useMyAvatarsSuspense } from '@entities/avatar';
import { cn } from '@shared/lib/cn';

const GRID_SLOTS = 3;

function HeaderCta({ isFull }: { isFull: boolean }) {
  return (
    <Button variant="ghost" size="sm" aria-label={isFull ? '더보기' : '아바타 추가하기'}>
      {isFull ? '더보기' : '추가하기 +'}
    </Button>
  );
}

function MyAvatarGridSkeleton() {
  return (
    <section aria-label="내 아바타" className="border-border bg-bg-elev-2 rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="bg-bg-elev-3 h-4 w-16 animate-pulse rounded" />
        <div className="bg-bg-elev-3 h-6 w-20 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: GRID_SLOTS }).map((_, i) => (
          <div key={i} className="bg-bg-elev-3 h-24 animate-pulse rounded-md" />
        ))}
      </div>
    </section>
  );
}

function MyAvatarGridFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <section aria-label="내 아바타" className="border-border bg-bg-elev-2 rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-ui text-ui text-text">내 아바타</h2>
      </div>
      <div className="text-text-3 text-mono-meta font-mono">불러올 수 없음</div>
      <button
        type="button"
        className="text-body-sm text-brand mt-2 underline"
        onClick={resetErrorBoundary}
      >
        재시도
      </button>
    </section>
  );
}

function MyAvatarGridContent() {
  const { items } = useMyAvatarsSuspense();
  const isFull = items.length >= GRID_SLOTS;
  const emptySlotCount = Math.max(0, GRID_SLOTS - items.length);

  return (
    <section aria-label="내 아바타" className="border-border bg-bg-elev-2 rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-ui text-ui text-text">내 아바타</h2>
        <HeaderCta isFull={isFull} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.slice(0, GRID_SLOTS).map((avatar) => {
          const active = avatar.isPrimary;
          return (
            <div
              key={avatar.id}
              data-active={active}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-md border p-2',
                active ? 'bg-brand-soft border-brand-border' : 'bg-bg border-border'
              )}
            >
              <div className="bg-brand-soft border-brand-border relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
                <span className="font-ui text-mono-meta text-brand font-semibold uppercase">
                  {avatar.initials}
                </span>
                <StatusDot status={avatar.status} className="absolute right-0 bottom-0" />
              </div>
              <div
                className={cn(
                  'font-ui text-mono-meta truncate text-center',
                  active ? 'text-brand' : 'text-text'
                )}
              >
                {avatar.name}
              </div>
              <Tag>{avatar.type}</Tag>
              {active && <Tag variant="brand">활성</Tag>}
            </div>
          );
        })}
        {Array.from({ length: emptySlotCount }).map((_, i) => (
          <div
            key={`empty-${i}`}
            data-empty-slot="true"
            className="border-border bg-bg flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-md border border-dashed"
          >
            <Plus size={18} className="text-text-4" aria-hidden="true" />
            <span className="text-mono-meta text-text-4 font-mono">새 아바타</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MyAvatarGrid() {
  return (
    <ErrorBoundary fallbackRender={(props) => <MyAvatarGridFallback {...props} />}>
      <Suspense fallback={<MyAvatarGridSkeleton />}>
        <MyAvatarGridContent />
      </Suspense>
    </ErrorBoundary>
  );
}
