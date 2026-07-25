import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { ToastProvider } from '@shared/ui/Toast';
import { SUPPORT_EMAIL_HREF } from '@shared/config/constants';
import { router } from './router';
import { handleAppCrash } from './handleAppCrash';
import { queryClientConfig } from './queryClientConfig';

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

  // chat3 정본: 코드/스택 비노출, 부드러운 "~요" 카피 + danger 톤 아이콘 컨테이너.
  return (
    <main className="bg-bg text-text flex min-h-screen items-center justify-center px-6 py-12">
      <div role="alert" className="flex max-w-[480px] flex-col items-center text-center">
        <div className="text-danger flex h-14 w-14 items-center justify-center rounded-xl border border-[rgba(248,81,73,0.2)] bg-[rgba(248,81,73,0.08)]">
          <AlertTriangle size={24} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h1 className="font-ui text-title text-text mt-6">일시적인 문제가 발생했어요</h1>
        <p className="text-text-3 mt-2.5 max-w-[320px] text-[13px] leading-[1.8]">
          잠깐 문제가 생긴 것 같아요. 잠시 후 다시 시도해 보거나, 메인 화면으로 돌아가 주세요.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={handleRetry}>다시 시도</Button>
          <Button variant="secondary" onClick={handleContact}>
            문의하기
          </Button>
        </div>
      </div>
    </main>
  );
}

export function App() {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));

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
