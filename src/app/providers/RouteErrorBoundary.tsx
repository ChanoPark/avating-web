import type { ReactNode } from 'react';
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router';
import type { ErrorVariant } from '@pages/error';
import { isApiError } from '@shared/lib/errors';
import { useAuthStore } from '@entities/auth/store';
import { handleAppCrash } from '../handleAppCrash';

// 정적 import 로 바꾸지 않는다 — 코드 스플리팅이 풀리면 ErrorPage 무게가 모든 라우트의 최초 진입
// 청크에 얹힌다.
const ErrorPage = lazy(() => import('@pages/error').then((m) => ({ default: m.ErrorPage })));

/**
 * 서버 message 를 그대로 띄우지 않는다 — 상태 코드만 보고 화면을 고른다.
 * 401 과 403 은 다른 화면이다 — 401 은 셸 없이 세션 만료를, 403 은 셸을 유지한 채 권한 없음을 알린다.
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
  /** 앱 셸 안에 있을 때 true — 사이드바를 유지한 채 본문만 교체한다. */
  embedded?: boolean;
};

export function RouteErrorBoundary({ children, embedded = false }: RouteErrorBoundaryProps) {
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const location = useLocation();

  return (
    // 형제 라우트로 옮겨도 같은 경계 인스턴스가 재사용된다 — 위치가 바뀌면 풀어 줘야 에러 화면의
    // 이동 버튼이 실제로 다음 화면을 보여준다.
    <ErrorBoundary
      resetKeys={[location.key]}
      onError={handleAppCrash}
      fallbackRender={({ error }) => (
        // 청크 로딩 중 빈 프레임에 스켈레톤을 쓰면 로딩으로 오인된다 — 배경만 채운 빈 면으로 둔다.
        <Suspense fallback={<div className="bg-canvas min-h-screen" />}>
          <ErrorPage
            variant={toErrorVariant(error)}
            embedded={embedded}
            isAuthenticated={isAuthenticated}
          />
        </Suspense>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
