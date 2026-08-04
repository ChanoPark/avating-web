import type { ReactNode } from 'react';
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import type { ErrorVariant } from '@pages/error';
import { isApiError } from '@shared/lib/errors';
import { handleAppCrash } from '../handleAppCrash';

// router.tsx 도 같은 모듈을 lazy 로 가져간다. 여기서 정적 import 하면 그 코드 스플리팅이
// 무력화돼 ErrorPage 가 메인 청크로 흡수된다 — 에러 화면이 필요 없는 최초 진입 라우트
// (`/`·`/login`·`/signup`)까지 그 무게를 매번 내려받게 된다.
const ErrorPage = lazy(() => import('@pages/error').then((m) => ({ default: m.ErrorPage })));

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
  // lazy 라 청크가 도착하기 전 한 프레임이 비는데, 에러 화면 자리에 스켈레톤을 깜빡이면
  // 로딩으로 오인된다. 배경만 채운 빈 면으로 둔다.
  return (
    <Suspense fallback={<div className="bg-canvas min-h-screen" />}>
      <ErrorPage variant={toVariant(error)} onRetry={resetErrorBoundary} />
    </Suspense>
  );
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
    // onError 없이 두면 라우트 예외가 여기서 완전히 삼켜져 관측 통로가 사라진다.
    // 루트 경계(App.tsx)와 같은 핸들러를 재사용한다.
    <ErrorBoundary FallbackComponent={RouteFallback} onError={handleAppCrash}>
      <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
