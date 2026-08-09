import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { RouteErrorBoundary } from './RouteErrorBoundary';

/** 라우트 청크·Suspense 쿼리 로딩 구간. 백지 대신 최소한의 자리표시를 둔다. */
function RouteSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center p-7"
    >
      <div className="flex w-full max-w-120 flex-col gap-3 motion-safe:animate-pulse">
        <div className="bg-canvas-soft h-6 w-2/5 rounded-md" />
        <div className="bg-canvas-soft h-4 w-3/5 rounded-md" />
        <div className="bg-canvas-soft h-40 w-full rounded-lg" />
      </div>
      <span className="sr-only">불러오는 중이에요</span>
    </div>
  );
}

type SuspenseRouteProps = {
  children: ReactNode;
};

export function SuspenseRoute({ children }: SuspenseRouteProps) {
  return (
    // 셸 **밖**의 경계다. 셸 크롬 자체가 터진 경우까지 여기서 받으므로 embedded 가 아니다.
    // 셸 안쪽 본문의 실패는 AppShellLayout 이 자기 경계로 먼저 잡는다.
    <RouteErrorBoundary>
      <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}
