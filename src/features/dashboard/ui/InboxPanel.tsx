import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Button } from '@shared/ui/Button';
import { useInboxSuspense } from '@entities/inbox';
import { cn } from '@shared/lib/cn';

function formatRelativeTime(occurredAt: string): string {
  const occurred = new Date(occurredAt);
  if (Number.isNaN(occurred.getTime())) return '';
  const diffMs = Date.now() - occurred.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

function InboxPanelSkeleton() {
  return (
    <section aria-label="메시지함" className="border-border bg-bg-elev-2 rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="bg-bg-elev-3 h-4 w-16 animate-pulse rounded" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-bg-elev-3 h-10 animate-pulse rounded" />
        ))}
      </div>
    </section>
  );
}

function InboxPanelFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <section aria-label="메시지함" className="border-border bg-bg-elev-2 rounded-md border p-4">
      <h2 className="font-ui text-ui text-text mb-3">메시지함</h2>
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

function InboxPanelContent() {
  const { items, unreadCount } = useInboxSuspense();

  return (
    <section
      aria-label="메시지함"
      className="border-border bg-bg-elev-2 flex flex-col rounded-md border p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-ui text-ui text-text">메시지함</h2>
        {unreadCount > 0 && (
          <span
            aria-label={`읽지 않은 메시지 ${unreadCount}개`}
            className="bg-brand text-mono-meta inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono font-semibold text-white"
          >
            {unreadCount}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-text-3 text-body-sm py-4 text-center">새 메시지가 없습니다</p>
      ) : (
        <ul className="flex flex-1 flex-col gap-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              data-unread={!item.read}
              className={cn(
                'flex items-start gap-2 rounded-sm border p-2',
                item.read
                  ? 'border-transparent bg-transparent'
                  : 'bg-brand-soft border-brand-border/40'
              )}
            >
              <div className="bg-brand-soft border-brand-border flex h-7 w-7 shrink-0 items-center justify-center rounded-full border">
                <span className="font-ui text-mono-meta text-brand font-semibold uppercase">
                  {item.sender.initials}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-ui text-mono-meta text-text font-medium">
                    {item.sender.name}
                  </span>
                  <span className="text-mono-meta text-text-3 font-mono">
                    {formatRelativeTime(item.occurredAt)}
                  </span>
                </div>
                <p className="text-text-2 text-mono-meta truncate font-mono">{item.message}</p>
              </div>
              {!item.read && (
                <span
                  aria-hidden="true"
                  className="bg-brand mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <Button variant="ghost" size="sm" className="mt-3 w-full justify-center">
        전체 보기
      </Button>
    </section>
  );
}

export function InboxPanel() {
  return (
    <ErrorBoundary fallbackRender={(props) => <InboxPanelFallback {...props} />}>
      <Suspense fallback={<InboxPanelSkeleton />}>
        <InboxPanelContent />
      </Suspense>
    </ErrorBoundary>
  );
}
