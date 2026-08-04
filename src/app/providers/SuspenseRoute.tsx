import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorPage, type ErrorVariant } from '@pages/error';
import { isApiError } from '@shared/lib/errors';

/**
 * 서버가 준 message 를 그대로 화면에 띄우면 안 된다 — 실서버 QA 에서
 * `/dashboard` 가 백지 위 "요청한 리소스를 찾을 수 없습니다" 한 줄로 대체됐다(S6).
 * 상태 코드만 보고 사용자 언어의 화면으로 옮긴다.
 */
function toVariant(error: unknown): ErrorVariant {
  if (!isApiError(error)) return 'server-error';
  if (error.statusCode === 404) return 'not-found';
  if (error.statusCode === 403 || error.statusCode === 401) return 'forbidden';
  // parseApiError 는 응답 자체가 없는 네트워크 오류를 statusCode 0 으로 만든다.
  if (error.statusCode === 0) return 'offline';
  return 'server-error';
}

function RouteFallback({ error, resetErrorBoundary }: FallbackProps) {
  return <ErrorPage variant={toVariant(error)} onRetry={resetErrorBoundary} />;
}

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
    <ErrorBoundary FallbackComponent={RouteFallback}>
      <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
