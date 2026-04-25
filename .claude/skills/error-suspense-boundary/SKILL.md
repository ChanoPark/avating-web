---
name: error-suspense-boundary
description: React Suspense + react-error-boundary — 계층적 경계 배치, fallback UX, 복구 패턴, Sentry 연동, TanStack Query 와의 합성
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(로딩-에러)
  - CLAUDE.md#개발-규칙
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# Suspense + ErrorBoundary — 계층적 실패 격리

## 1. 원칙

1. **계층적 격리**: 앱 전체를 하나의 경계로 감싸지 않는다. 루트/라우트/피처/위젯 최소 4단.
2. **침묵 금지**: 모든 에러는 UI 표시 + 관측(Sentry) 동시 수행.
3. **복구 가능성**: 대부분 `retry()` 제공. 치명적 에러만 전체 재로드.
4. **UX 우선**: fallback 은 **사용자 친화 메시지**, 스택 노출 금지.

## 2. Install

```bash
pnpm add react-error-boundary
```

> TanStack Query v5 는 `throwOnError` 로 에러를 상위 경계로 throw 할 수 있다. (→ `data-tanstack-axios-zod`)

## 3. 경계 계층 (Required layout)

```
<SentryRoot>                           ← Sentry ErrorBoundary (최후 안전망)
  <RouterProvider>                     ← 라우트 errorElement
    <RootLayout>
      <Suspense fallback={<RouteSkeleton />}>  ← 라우트 전환 로딩
        <Outlet />
        └─ Page
             <FeatureBoundary>         ← 피처 단위 ErrorBoundary + Suspense
               <WidgetBoundary>        ← 독립 실패 허용 위젯
```

## 4. 공용 Boundary 컴포넌트

```tsx
// src/shared/ui/Boundary/FeatureBoundary.tsx
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Suspense, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';

interface Props {
  name: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const DefaultError = ({ error, resetErrorBoundary }: FallbackProps) => {
  const friendly = humanize(error);
  return (
    <div role="alert" className="grid place-items-center gap-2 rounded-lg border border-danger/40 p-4">
      <p className="text-sm text-danger">{friendly.title}</p>
      {friendly.hint && <p className="text-xs text-foreground-muted">{friendly.hint}</p>}
      <button className="btn" onClick={resetErrorBoundary}>다시 시도</button>
    </div>
  );
};

export const FeatureBoundary = ({ name, fallback, children }: Props) => {
  const qc = useQueryClient();
  return (
    <ErrorBoundary
      FallbackComponent={DefaultError}
      onError={(err, info) => {
        Sentry.withScope((scope) => {
          scope.setTag('boundary', name);
          scope.setExtra('componentStack', info.componentStack);
          Sentry.captureException(err);
        });
      }}
      onReset={() => qc.invalidateQueries()}
    >
      <Suspense fallback={fallback ?? <FeatureSkeleton name={name} />}>{children}</Suspense>
    </ErrorBoundary>
  );
};
```

**이유**:
- `onReset` 에서 전역 invalidate 는 과감하지만 단순. 특정 키만 무효화하려면 `resetKeys` 로 대체.
- `withScope` 태깅으로 Sentry 에서 피처별 필터링 가능.

## 5. 에러 분류 & Humanize

```ts
// src/shared/lib/error-humanize.ts
import { isAppError } from './errors';

export const humanize = (error: unknown): { title: string; hint?: string; retryable: boolean } => {
  if (isAppError(error)) {
    switch (error.code) {
      case 'TIMEOUT':  return { title: '네트워크가 느립니다', hint: '잠시 후 다시 시도해 주세요.', retryable: true };
      case 'NETWORK':  return { title: '연결이 불안정합니다', retryable: true };
      case 'AUTH':     return { title: '다시 로그인해 주세요', retryable: false };
      case 'QUOTA':    return { title: '다이아가 부족해요', hint: '충전 후 이용해 주세요.', retryable: false };
    }
  }
  if (error instanceof ZodError) return { title: '서버 응답을 이해하지 못했어요', retryable: true };
  return { title: '문제가 발생했어요', hint: '문제가 반복되면 고객센터로 알려주세요.', retryable: true };
};
```

- 절대 에러 원문/스택을 UI 에 노출하지 않는다.
- Sentry 에는 원문 그대로 전송(PII 제거된 상태).

## 6. Suspense Fallback 디자인

- **레이아웃 보존 스켈레톤**이 원칙. Spinner only 는 지양.
- 로딩 예상 시간 > 500ms 인 영역에서 사용, 미만은 `isLoading` 인라인.
- 애니메이션은 `prefers-reduced-motion` 존중.
- 접근성: `aria-busy="true"` + 스크린리더 설명(`sr-only` 텍스트).

```tsx
export const FeatureSkeleton = ({ name }: { name: string }) => (
  <div aria-busy role="status" className="animate-pulse space-y-2">
    <span className="sr-only">{name} 로딩 중</span>
    <div className="h-4 w-1/2 rounded bg-surface-muted" />
    <div className="h-4 w-3/4 rounded bg-surface-muted" />
  </div>
);
```

## 7. 에러 복구 전략 매트릭스

| 상황 | 정책 |
|---|---|
| 네트워크 일시 오류 | `retry` 버튼, `invalidateQueries` |
| 권한 만료 401 | 자동 refresh → 실패 시 `/login` redirect |
| 권한 부족 403 | 경계에서 메시지 + 대체 링크 |
| 404 리소스 없음 | 해당 라우트의 ErrorBoundary 에서 NotFound 뷰 |
| 500 서버 오류 | `retry` 제공 + Sentry 전송, 3회 이상 재시도 시 전체 페이지 리로드 유도 |
| Zod 파싱 실패 | UI: 일반 메시지. Sentry: 스키마/차이 전송. 스펙 드리프트 경보. |

## 8. React 19 Suspense 주의

- **Suspense 는 렌더 중에만 감지**. 이벤트 핸들러 내부의 비동기는 `useTransition` 이나 React 19 Actions 사용.
- **동일한 경계** 내부에서 다수의 Suspense 소스(쿼리 여러 개)는 **병렬 waterfalls** 회피 — `Promise.all` 또는 `useSuspenseQueries`.

## 9. TanStack Query 연동 패턴

```tsx
// 피처 안에서
const { data } = useSuspenseAvatar(id); // throwOnError 기본 true
```

- `useSuspenseQuery` 사용 시 데이터는 항상 존재(undefined 제거).
- 뮤테이션 에러는 기본 `throwOnError: false` — 경계까지 가지 않고 인라인 처리.

## 10. Sentry ErrorBoundary 와의 합성

```tsx
// src/app/providers/ObservabilityProvider.tsx
import * as Sentry from '@sentry/react';

export const ObservabilityProvider = ({ children }: { children: React.ReactNode }) => (
  <Sentry.ErrorBoundary
    fallback={({ resetError }) => <GlobalErrorPage onRetry={resetError} />}
    showDialog={false}
  >
    {children}
  </Sentry.ErrorBoundary>
);
```

- 앱 루트 1개만 Sentry 경계.
- 하위는 `react-error-boundary` — 복구 가능성 우선.

## 11. 라우트 수준 Error

React Router v7 의 `errorElement` / `ErrorBoundary`:

```tsx
export const ErrorBoundary = () => {
  const error = useRouteError();
  useEffect(() => Sentry.captureException(error), [error]);
  return <GlobalErrorPage onRetry={() => location.reload()} />;
};
```

## 12. 개발 중 디버깅 힌트

- `import.meta.env.DEV` 에서는 fallback 하단에 **원문 스택** 표시 섹션 토글 제공(접근성 무관).
- Sentry Replay(prod, sampling 낮게) 로 재현 보조.

## 13. 안티패턴

- 컴포넌트 내부 `try/catch` 로 에러를 숨김 — ErrorBoundary 로 위임.
- `Suspense` 없이 `React.lazy` 사용.
- 전체 앱을 하나의 ErrorBoundary 만으로 감싸기 — 실패 시 전체 화이트 스크린.
- 에러 메시지를 alert 역할 없이 표시(스크린리더 미인식).
- 민감 에러 원문(SQL, 토큰) UI 노출.
- `onReset` 에 DOM 상태 부작용(location reload) — 마지막 수단으로만.

## 14. 체크리스트

- [ ] 앱 루트 Sentry 경계 1개.
- [ ] 모든 라우트에 ErrorBoundary + Suspense.
- [ ] 주요 피처 단위 FeatureBoundary.
- [ ] fallback UI 가 레이아웃을 보존.
- [ ] `role="alert"` / `role="status"` 지정.
- [ ] `retry` 제공 + 실패 시 대체 경로.
- [ ] 스택/원문 UI 노출 제로.

## 15. References

- [react-error-boundary (Brian Vaughn / community)](https://github.com/bvaughn/react-error-boundary)
- [React docs — Suspense](https://react.dev/reference/react/Suspense)
- [TanStack Query — Suspense](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)
- [Sentry React SDK — Error Boundary](https://docs.sentry.io/platforms/javascript/guides/react/components/errorboundary/)
- 내부: [data-tanstack-axios-zod](../data-tanstack-axios-zod/SKILL.md), [observability-sentry-amplitude](../observability-sentry-amplitude/SKILL.md)
