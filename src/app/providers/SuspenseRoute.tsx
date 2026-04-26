import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function RouteFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-danger">{error.message}</p>
    </div>
  );
}

type SuspenseRouteProps = {
  children: ReactNode;
};

export function SuspenseRoute({ children }: SuspenseRouteProps) {
  return (
    <ErrorBoundary FallbackComponent={RouteFallback}>
      <Suspense fallback={null}>{children}</Suspense>
    </ErrorBoundary>
  );
}
