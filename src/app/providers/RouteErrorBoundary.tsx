import type { ReactNode } from 'react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router';
import type { ErrorVariant } from '@pages/error';
import { isApiError } from '@shared/lib/errors';
import { useAuthStore } from '@entities/auth/store';
import { handleAppCrash } from '../handleAppCrash';

// router.tsx 도 같은 모듈을 lazy 로 가져간다. 여기서 정적 import 하면 그 코드 스플리팅이
// 무력화돼 ErrorPage 가 메인 청크로 흡수된다 — 에러 화면이 필요 없는 최초 진입 라우트
// (`/`·`/login`·`/signup`)까지 그 무게를 매번 내려받게 된다.
const ErrorPage = lazy(() => import('@pages/error').then((m) => ({ default: m.ErrorPage })));

/**
 * 서버가 준 message 를 그대로 화면에 띄우면 안 된다 — 실서버 QA 에서
 * `/dashboard` 가 백지 위 "요청한 리소스를 찾을 수 없습니다" 한 줄로 대체됐다(S6).
 * 상태 코드만 보고 사용자 언어의 화면으로 옮긴다.
 *
 * 401 과 403 은 정본에서 서로 다른 화면이다 — 401 은 셸 없는 S-11-01(세션 만료),
 * 403 은 셸을 유지하는 S-11-02(권한 없음). 예전처럼 한 variant 로 뭉개지 않는다.
 */
function toErrorVariant(error: unknown): ErrorVariant {
  if (!isApiError(error)) return 'server-error';
  if (error.statusCode === 401) return 'session-expired';
  if (error.statusCode === 403) return 'forbidden';
  if (error.statusCode === 404) return 'not-found';
  // parseApiError 는 응답 자체가 없는 네트워크 오류를 statusCode 0 으로 만든다.
  if (error.statusCode === 0) return 'offline';
  return 'server-error';
}

type RouteErrorBoundaryProps = {
  children: ReactNode;
  /** 앱 셸 안에 놓일 때 true — 403·404·500 이 사이드바를 유지한 채 본문만 교체한다. */
  embedded?: boolean;
};

/**
 * 라우트 단위 에러 경계. `SuspenseRoute`(셸 밖)와 `AppShellLayout`(셸 안) 두 곳이 마운트한다.
 *
 * 재시도 횟수를 **경계 바깥**에서 센다. `resetErrorBoundary()` 는 fallback 을 언마운트하므로
 * ErrorPage 안에 카운터를 두면 매번 0 으로 돌아가고 S-11-05(3회 실패) 승격이 영영 안 걸린다.
 */
export function RouteErrorBoundary({ children, embedded = false }: RouteErrorBoundaryProps) {
  const [retryCount, setRetryCount] = useState(0);
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  // 다른 화면으로 넘어가면 이전 화면의 실패 이력은 의미가 없다.
  useEffect(() => {
    setRetryCount(0);
  }, [location.key]);

  return (
    <ErrorBoundary
      onError={handleAppCrash}
      fallbackRender={({ error, resetErrorBoundary }) => (
        // lazy 라 청크가 도착하기 전 한 프레임이 비는데, 에러 화면 자리에 스켈레톤을
        // 깜빡이면 로딩으로 오인된다. 배경만 채운 빈 면으로 둔다.
        <Suspense fallback={<div className="bg-canvas min-h-screen" />}>
          <ErrorPage
            variant={toErrorVariant(error)}
            embedded={embedded}
            retryCount={retryCount}
            isAuthenticated={isAuthenticated}
            onRetry={() => {
              setRetryCount((c) => c + 1);
              resetErrorBoundary();
            }}
          />
        </Suspense>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
