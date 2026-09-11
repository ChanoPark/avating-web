import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { RouteErrorBoundary } from './RouteErrorBoundary';

function RouteSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center p-7"
    >
      <div className="flex w-full max-w-120 flex-col gap-3 motion-safe:animate-pulse">
        <div className="bg-raised rounded-card h-6 w-2/5" />
        <div className="bg-raised rounded-card h-4 w-3/5" />
        <div className="bg-raised rounded-card h-40 w-full" />
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
    // 셸 **밖** 경계다 — 셸 안쪽 실패는 AppShellLayout 이 자기 경계로 따로 잡는다.
    <RouteErrorBoundary>
      <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}
