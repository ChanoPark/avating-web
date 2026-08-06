import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@entities/auth/store';

type AuthGuardProps = {
  children: ReactNode;
};

/**
 * 세션 복구 대기 화면. 부팅 복구가 refresh 왕복을 도는 짧은 구간에만 보인다.
 * 여기서 `/login` 으로 보내면 새로고침이 곧 로그아웃이 된다.
 */
function AuthRestoring() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center">
      <span
        aria-hidden="true"
        className="bg-primary h-2 w-2 rounded-full motion-safe:animate-pulse"
      />
      <span className="sr-only">로그인 상태를 확인하는 중이에요</span>
    </div>
  );
}

export function AuthGuard({ children }: AuthGuardProps) {
  // 만료 여부(`isAuthenticated()`)가 아니라 `status` 로 판단한다.
  // accessToken 이 만료돼도 refreshToken 이 살아 있으면 401 인터셉터가 갱신하므로
  // 화면을 로그인으로 되돌릴 이유가 없다. 갱신이 실패하면 onUnauthorized → clear() 가
  // status 를 anonymous 로 내려 그때 리다이렉트된다.
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
