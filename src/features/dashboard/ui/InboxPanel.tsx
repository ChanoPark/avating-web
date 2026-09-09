import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { InlineError } from '@shared/ui/InlineError';
import { Bell, MessageSquare } from 'lucide-react';
import { EmptyState } from '@shared/ui/EmptyState';
import { useInboxSuspense } from '@entities/inbox';
import { cn } from '@shared/lib/cn';

const CARD_CLASS = 'border-subtle bg-canvas flex flex-col gap-2 rounded-card border p-4';

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

function CardHeader({
  unreadCount = 0,
  action,
}: {
  unreadCount?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <h2 className="text-caption text-primary font-medium">알림</h2>
        {unreadCount > 0 && (
          <span
            aria-label={`읽지 않은 알림 ${unreadCount}개`}
            className="bg-count text-count-text text-meta tnum inline-flex h-4.5 items-center rounded-full px-1.75 font-medium"
          >
            {unreadCount}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

function InboxPanelSkeleton() {
  return (
    <section aria-label="알림" className={CARD_CLASS}>
      <div className="flex items-center justify-between">
        <div className="bg-raised rounded-chip h-4 w-12 animate-pulse" />
        <div className="bg-raised rounded-chip h-4 w-14 animate-pulse" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-raised rounded-card h-12 animate-pulse" />
      ))}
    </section>
  );
}

// 정본 S-11-06 PANEL — 패널 자리만 교체하고, 카드 머리는 남겨 무엇이 실패했는지 알 수 있게 한다.
function InboxPanelFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <section aria-label="알림" className={CARD_CLASS}>
      <CardHeader />
      <InlineError body="알림을 불러오지 못했어요" onRetry={resetErrorBoundary} />
    </section>
  );
}

function InboxPanelContent() {
  const { items, unreadCount } = useInboxSuspense();

  return (
    <section aria-label="알림" className={CARD_CLASS}>
      <CardHeader
        unreadCount={unreadCount}
        action={
          <button
            type="button"
            className="text-action hover:text-action-hover text-meta cursor-pointer font-medium"
          >
            전체 보기
          </button>
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={MessageSquare} title="새 알림이 없습니다" />
      ) : (
        <ul className="flex flex-1 flex-col gap-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              data-unread={!item.read}
              // 읽지 않음 강조는 틴트 채움이 아니라 흰 서피스 + 파란 테두리다.
              className={cn(
                'rounded-card flex items-center gap-2.5 border px-3 py-2.5',
                item.read ? 'border-transparent bg-transparent' : 'bg-selected border-transparent'
              )}
            >
              <span
                aria-hidden="true"
                className="bg-canvas text-secondary rounded-card flex h-7 w-7 shrink-0 items-center justify-center"
              >
                <Bell size={14} strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-caption text-primary block truncate">{item.message}</span>
                <span className="text-meta text-secondary block truncate">{item.sender.name}</span>
              </span>
              <span className="text-meta text-secondary tnum shrink-0">
                {formatRelativeTime(item.occurredAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
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
