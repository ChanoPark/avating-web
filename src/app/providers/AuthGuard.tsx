import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@entities/auth/store';

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(window.location.pathname);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}
