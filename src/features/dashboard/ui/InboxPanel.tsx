import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { InlineError } from '@shared/ui/InlineError';
import { Bell, MessageSquare } from 'lucide-react';
import { EmptyState } from '@shared/ui/EmptyState';
import { useInboxSuspense } from '@entities/inbox';
import { cn } from '@shared/lib/cn';

// wf-s2-core `ScreenDashboard` 우측 하단 `알림` 카드 — 카드 규격은 좌측 내 아바타 카드와 같다.
const CARD_CLASS =
  'border-hairline bg-surface shadow-card flex flex-col gap-2 rounded-lg border p-4';

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
        <h2 className="text-caption text-ink font-medium">알림</h2>
        {unreadCount > 0 && (
          // 카운트 배지 문법 — LAYOUT-NUMBERS § 내비 카운트 배지 (brand wash, height 18, 11px, tnum)
          <span
            aria-label={`읽지 않은 알림 ${unreadCount}개`}
            className="bg-primary-wash text-primary-press rounded-pill text-micro tnum inline-flex h-4.5 items-center px-1.75 font-medium"
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
        <div className="bg-canvas-soft h-4 w-12 animate-pulse rounded" />
        <div className="bg-canvas-soft h-4 w-14 animate-pulse rounded" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-canvas-soft h-12 animate-pulse rounded-md" />
      ))}
    </section>
  );
}

// 정본 S-11-06 PANEL — 화면 전체를 덮지 않고 이 패널 자리만 교체한다.
// 카드 머리는 남겨 사용자가 무엇이 실패했는지 알 수 있게 한다.
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
            // 정본 링크 fontSize 12 — micro(11)/caption(13) 사이의 지정 값이다.
            className="text-primary hover:text-primary-hover cursor-pointer text-[12px] font-medium"
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
                'flex items-center gap-2.5 rounded-md border px-3 py-2.5',
                item.read ? 'border-transparent bg-transparent' : 'border-primary bg-surface'
              )}
            >
              {/* 알림 아이콘 상자 28 · radius 8 */}
              <span
                aria-hidden="true"
                className="bg-canvas text-ink-mute flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              >
                <Bell size={14} strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-caption text-ink block truncate">{item.message}</span>
                <span className="text-micro text-ink-mute block truncate">{item.sender.name}</span>
              </span>
              <span className="text-micro text-ink-mute tnum shrink-0">
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
