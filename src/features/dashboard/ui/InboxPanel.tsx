import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { InlineError } from '@shared/ui/InlineError';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@shared/ui/EmptyState';
import { useInboxSuspense } from '@entities/inbox';
import { cn } from '@shared/lib/cn';

// flex-1 — 우측 열에서 남는 높이를 채워 좌측 대표 아바타 카드와 밑단을 맞춘다(어느 쪽이 길든).
const CARD_CLASS = 'border-subtle bg-canvas flex flex-1 flex-col gap-2 rounded-card border p-4';

// 정본 `.wf2-noti` — 행은 판이 아니라 1px inset 선으로 나뉜다(`.wf2-noti+.wf2-noti`).
const ROW_CLASS =
  'flex items-center gap-2.5 px-3 py-2.5 [&+*]:shadow-[inset_0_1px_0_var(--border-subtle)]';

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

// 실제 행과 **같은 래퍼**(ROW_CLASS)에 같은 줄상자를 세운다. 예전에는 h-12(48px) 자리표시자가
// 58.8px 행으로 바뀌면서 패널이 28px 자랐다.
function InboxPanelSkeleton() {
  return (
    <section aria-label="알림" className={CARD_CLASS}>
      <div className="flex animate-pulse items-center justify-between gap-2">
        <span className="text-caption bg-raised rounded-chip w-12 font-medium">&nbsp;</span>
        <span className="text-meta bg-raised rounded-chip w-14 font-medium">&nbsp;</span>
      </div>
      <div className="flex flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} aria-hidden="true" className={cn(ROW_CLASS, 'animate-pulse')}>
            <span className="bg-raised size-1.5 shrink-0 rounded-full" />
            <span className="min-w-0 flex-1">
              <span className="text-caption bg-raised rounded-chip block w-40">&nbsp;</span>
              <span className="text-meta bg-raised rounded-chip block w-20">&nbsp;</span>
            </span>
            <span className="text-meta bg-raised rounded-chip w-12 shrink-0">&nbsp;</span>
          </div>
        ))}
      </div>
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
            className="text-action hover:text-action-hover text-meta ease-standard cursor-pointer font-medium transition-colors duration-[var(--dur-fast)]"
          >
            전체 보기
          </button>
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={MessageSquare} title="새 알림이 없어요" />
      ) : (
        <ul className="flex flex-1 flex-col">
          {items.map((item) => (
            <li key={item.id} data-unread={!item.read} className={ROW_CLASS}>
              {/* 안읽음은 정본 `.wf2-noti__dot` 6px 잉크 점 + 제목 굵기로 말한다 — 행을 통째로
                  칠하면 목록 안에서 일부 행만 판이 생겨 리듬이 끊긴다. 읽은 행도 같은 폭을
                  차지해야 글자 좌단이 어긋나지 않는다. */}
              <span
                aria-hidden="true"
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  item.read ? 'bg-transparent' : 'bg-ink'
                )}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'text-caption block truncate',
                    item.read ? 'text-secondary' : 'text-ink font-semibold'
                  )}
                >
                  {item.message}
                </span>
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
