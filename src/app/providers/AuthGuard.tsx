import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@entities/auth/store';

type AuthGuardProps = {
  children: ReactNode;
};

/**
 * 여기서 `/login` 으로 보내면 새로고침이 곧 로그아웃이 된다.
 */
function AuthRestoring() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center">
      <span
        aria-hidden="true"
        className="bg-secondary h-2 w-2 rounded-full motion-safe:animate-pulse"
      />
      <span className="sr-only">로그인 상태를 확인하는 중이에요</span>
    </div>
  );
}

export function AuthGuard({ children }: AuthGuardProps) {
  // status 로 판단한다 — isAuthenticated() 를 쓰면 accessToken 이 만료됐을 때 refreshToken 이
  // 살아 있어도 로그인 화면으로 돌려보낸다.
  const status = useAuthStore((s) => s.status);

  if (status === 'restoring') {
    return <AuthRestoring />;
  }

  if (status !== 'authenticated') {
    const redirect = encodeURIComponent(window.location.pathname);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
