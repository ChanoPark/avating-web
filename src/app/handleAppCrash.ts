import type { ErrorInfo } from 'react';

// Sentry 미통합 상태의 임시 통로. 통합 후 Sentry.captureException(error, { contexts: { react: info } }) 로 교체.
// TODO(sentry): observability-sentry-amplitude 도입 시 이 핸들러를 Sentry.captureException 호출로 교체.
export function handleAppCrash(error: Error, info: ErrorInfo) {
  console.error('[AppBoundary]', error, info);
}
