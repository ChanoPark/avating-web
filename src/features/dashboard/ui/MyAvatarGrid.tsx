import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { InlineError } from '@shared/ui/InlineError';
import { Badge } from '@shared/ui/Badge';
import { cn } from '@shared/lib/cn';
import { useMyAvatarsSuspense } from '@entities/avatar';
import type { MyAvatar } from '@entities/match-request';
import type { AvatarStatus } from '@entities/avatar';

// 폭 300 고정은 페이지(부모)가 준다 — 여기서는 지정하지 않는다.
// 높이는 h-full 로 부모 행(items-stretch)에 맞춘다 — 정본 wf-s2-core ScreenDashboard 의
// `<Row align="stretch">` 직속 Card 와 같은 결과다. 감싸는 div 만 늘어나고 카드가 남으면 우측 열과 밑단이 어긋난다.
const CARD_CLASS = 'border-subtle bg-canvas flex h-full flex-col gap-3 rounded-card border p-4';

// 시스템이 알려주는 상태라 무채색이다 — 색이 아니라 마크의 **모양**으로 나뉜다
// (.cx-status__mark: 채움 / 맥동 / 빈 링).
const STATUS_BADGE: Record<AvatarStatus, { label: string; mark: 'active' | 'running' | 'idle' }> = {
  online: { label: '활성', mark: 'active' },
  busy: { label: '매칭 중', mark: 'running' },
  offline: { label: '오프라인', mark: 'idle' },
};

function CardHeader({ action }: { action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-caption text-primary font-medium">내 아바타</h2>
      {action}
    </div>
  );
}

// 실제 콘텐츠와 같은 골격을 세운다 — 앞 두 단만 두면 로드 후 카드가 늘어나 CLS 가 생긴다.
function MyAvatarGridSkeleton() {
  return (
    <section aria-label="내 아바타" className={cn(CARD_CLASS, 'animate-pulse')}>
      <div className="flex items-center justify-between">
        <div className="bg-raised rounded-chip h-4 w-16" />
        <div className="bg-raised rounded-chip h-4 w-14" />
      </div>
      <div className="bg-raised h-11 rounded-[11px]" />
      <hr className="border-subtle border-t" />
      <div className="flex items-center justify-between">
        <div className="bg-raised rounded-chip h-3 w-20" />
        <div className="bg-raised rounded-chip h-3 w-8" />
      </div>
    </section>
  );
}

// 정본 S-11-06 PANEL — 실패한 영역만 교체하고 재시도는 그 자리에 둔다.
function MyAvatarGridFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <section aria-label="내 아바타" className={CARD_CLASS}>
      <CardHeader />
      <InlineError body="내 아바타를 불러오지 못했어요" onRetry={resetErrorBoundary} />
    </section>
  );
}

function EmptyAvatarBody() {
  return (
    <p className="text-caption text-secondary">
      아직 아바타가 없어요. 아바타를 만들면 여기에서 상태를 확인할 수 있어요.
    </p>
  );
}

function AvatarSummary({ avatar }: { avatar: MyAvatar }) {
  const status = STATUS_BADGE[avatar.status];
  return (
    <div className="flex items-center gap-2.75">
      <span
        aria-hidden="true"
        className="bg-id-none text-id-none-fg text-caption flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] font-semibold uppercase"
      >
        {avatar.initials}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.75">
        <span className="flex items-center gap-1.5">
          <span className="text-caption text-primary truncate font-medium">{avatar.name}</span>
          <Badge mark={status.mark}>{status.label}</Badge>
        </span>
        <span className="text-meta text-secondary truncate">{avatar.type}</span>
      </span>
    </div>
  );
}

function MyAvatarGridContent() {
  const { items } = useMyAvatarsSuspense();
  const primary = items.find((a) => a.isPrimary) ?? items[0];
  const busyCount = items.filter((a) => a.busy).length;

  return (
    <section aria-label="내 아바타" className={CARD_CLASS}>
      <CardHeader
        action={
          <button
            type="button"
            aria-label="아바타 추가하기"
            className="text-action hover:text-action-hover text-meta cursor-pointer font-medium"
          >
            추가하기
          </button>
        }
      />
      {primary === undefined ? (
        <EmptyAvatarBody />
      ) : (
        <>
          <AvatarSummary avatar={primary} />
          <hr className="border-subtle border-t" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-meta text-secondary">진행 중 매칭</span>
            <span className="text-caption text-primary tnum">
              {busyCount} / {items.length}
            </span>
          </div>
        </>
      )}
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
