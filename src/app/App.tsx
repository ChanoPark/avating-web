import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, ToastProvider } from '@shared/ui';
import { SUPPORT_EMAIL_HREF } from '@shared/config/constants';
import { router } from './router';
import { handleAppCrash } from './handleAppCrash';

// error prop 은 ErrorBoundary 의 onError(handleAppCrash) 경로에서 로깅된다.
// 사용자 노출용 화면에서는 PII/스택 누출 방지를 위해 error 객체를 직접 표시하지 않는다.
type AppFallbackProps = {
  resetErrorBoundary?: () => void;
};

export function AppFallback({ resetErrorBoundary }: AppFallbackProps = {}) {
  function handleRetry() {
    if (resetErrorBoundary) {
      resetErrorBoundary();
      return;
    }
    window.location.reload();
  }

  function handleContact() {
    window.location.href = SUPPORT_EMAIL_HREF;
  }

  return (
    <main className="bg-bg text-text flex min-h-screen items-center justify-center px-6 py-12">
      <div role="alert" className="flex max-w-md flex-col items-center text-center">
        <AlertTriangle size={24} className="text-text-3" aria-hidden="true" />
        <h1 className="text-heading text-text mt-6">일시적인 오류가 발생했습니다</h1>
        <p className="text-body-sm text-text-3 mt-3">
          잠시 후 다시 시도해주세요. 계속되면 문의해주세요.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={handleRetry}>다시 시도</Button>
          <Button variant="secondary" onClick={handleContact}>
            문의하기
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
    <ErrorBoundary FallbackComponent={AppFallback} onError={handleAppCrash}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
