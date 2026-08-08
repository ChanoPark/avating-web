import { lazy } from 'react';
import { useAuthStore } from '@entities/auth/store';
import { AppShellLayout } from '../layouts/AppShellLayout';

const ErrorPage = lazy(() => import('@pages/error').then((m) => ({ default: m.ErrorPage })));

/**
 * 매칭되지 않은 주소 (정본 S-11-03).
 *
 * 로그인 상태면 앱 셸을 유지하고 본문만 404 로 교체한다 — 사이드바로 빠져나갈 길을
 * 남기기 위해서다. 비로그인이면 셸 없이 S-11-01 과 같은 플랫 레이아웃에
 * "서비스 소개로 · 로그인" 액션을 준다.
 *
 * AuthGuard 로 감싸지 않는다. 감싸면 비로그인 사용자가 404 를 보지 못하고 로그인으로
 * 튕겨 나가는데, 정본은 그 경우에도 404 를 보여 주라고 규정한다.
 */
export function NotFoundRoute() {
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  if (!isAuthenticated) {
    return <ErrorPage variant="not-found" isAuthenticated={false} />;
  }

  return (
    <AppShellLayout>
      <ErrorPage variant="not-found" embedded isAuthenticated />
    </AppShellLayout>
  );
}
