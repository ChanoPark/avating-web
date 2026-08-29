import { lazy } from 'react';
import { useAuthStore } from '@entities/auth/store';
import { AppShellLayout } from '../layouts/AppShellLayout';

const ErrorPage = lazy(() => import('@pages/error').then((m) => ({ default: m.ErrorPage })));

/**
 * AuthGuard 로 감싸지 않는다 — 감싸면 비로그인 사용자가 404 대신 로그인으로 튕겨 나간다.
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
