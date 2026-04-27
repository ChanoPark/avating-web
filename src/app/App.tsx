import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { useState } from 'react';
import { ToastProvider } from '@shared/ui/Toast';
import { router } from './router';

function AppFallback({ error }: { error: Error }) {
  return (
    <div className="bg-bg flex min-h-screen items-center justify-center px-8">
      <div className="max-w-md text-center">
        <div className="text-mono-micro text-danger font-mono uppercase">ERROR</div>
        <h1 className="text-title text-text mt-3">앱을 불러오지 못했어요.</h1>
        <pre className="text-body-sm text-text-2 mt-4 whitespace-pre-wrap">{error.message}</pre>
      </div>
    </div>
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
