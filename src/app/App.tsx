import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { ToastProvider } from '@shared/ui/Toast';
import { router } from './router';

function AppFallback() {
  function handleRetry() {
    window.location.reload();
  }

  function handleHome() {
    window.location.assign('/');
  }

  return (
    <main
      role="alert"
      aria-live="polite"
      className="bg-bg text-text flex min-h-screen items-center justify-center px-6 py-12"
    >
      <div className="flex max-w-md flex-col items-center text-center">
        <AlertTriangle size={24} className="text-text-3" aria-hidden="true" />
        <h1 className="text-heading text-text mt-6">일시적인 오류가 발생했습니다</h1>
        <p className="text-body-sm text-text-3 mt-3">
          잠시 후 다시 시도해주세요. 계속되면 문의해주세요.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={handleRetry}>다시 시도</Button>
          <Button variant="secondary" onClick={handleHome}>
            홈으로
          </Button>
        </div>
        <div className="text-mono-meta text-text-3 mt-8 font-mono">ERROR_CODE: 500</div>
      </div>
    </main>
  );
}

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ErrorBoundary FallbackComponent={AppFallback}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
