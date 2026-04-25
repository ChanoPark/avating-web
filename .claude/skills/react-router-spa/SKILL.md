---
name: react-router-spa
description: React Router v7 Library Mode(SPA) — 라우트 설계, 데이터 로딩 정책, 가드, 에러/로딩 경계, CloudFront/S3 fallback
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(라우팅)
  - CLAUDE.md#환경-및-배포
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# React Router v7 — SPA Library Mode

## 1. 운영 방침

- **Library Mode 고정**. Framework/SSR/RSC 모드 금지.
- 호스팅: **S3 + CloudFront(OAC)**. 모든 unresolved 경로는 `/index.html` 로 200 rewrite (SPA fallback).
- **Data APIs(loader/action) 는 클라이언트 네트워크에 의존** — TanStack Query 와 역할을 분리한다(§5).

**이유**: 정적 배포의 캐시 레이어(Edge) 와 비용 최소화. SSR 로 넘어가는 순간 배포/보안/성능 모델이 전부 달라진다 → 현재 범위에서 불필요.

## 2. Install

```bash
pnpm add react-router@^7
```

> 패키지명은 `react-router` 한 가지로 통일됐다. (v7 부터 `react-router-dom` merged.)

## 3. Route Tree — `createBrowserRouter` + lazy objects

```tsx
// src/app/router.tsx
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router';
import { RootLayout } from '@app/layouts/RootLayout';
import { ErrorPage } from '@pages/Error';
import { requireAuth } from '@features/auth/model/guards';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, lazy: () => import('@pages/Home') },

      {
        path: 'onboarding',
        lazy: () => import('@pages/Onboarding'),
      },

      {
        path: 'matching',
        loader: requireAuth,                       // 인증 가드
        children: [
          { index: true, lazy: () => import('@pages/MatchingList') },
          { path: ':sessionId', lazy: () => import('@pages/MatchingSession') },
        ],
      },

      {
        path: 'my',
        loader: requireAuth,
        lazy: () => import('@pages/MyPage'),
      },

      { path: '*', lazy: () => import('@pages/NotFound') },
    ],
  },
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export const AppRouter = () => <RouterProvider router={router} />;
```

**Route convention**:
- `lazy()` 가 반환하는 모듈은 `{ Component, loader?, action?, ErrorBoundary?, meta? }` 를 export.
- 각 페이지 폴더는 **자신의 데이터 파생**(loader 에서는 Zod 파싱된 URL/세션 파라미터만 반환). 실제 fetch 는 컴포넌트 내부에서 TanStack Query 사용.

### 3.1 페이지 모듈 표준 (예시)
```tsx
// src/pages/MatchingSession/index.tsx
import type { LoaderFunctionArgs } from 'react-router';
import { SessionIdParam } from './model/params';

export const loader = ({ params }: LoaderFunctionArgs) => {
  const sessionId = SessionIdParam.parse(params.sessionId); // Zod
  return { sessionId };
};

export const Component = () => {
  const { sessionId } = useLoaderData() as { sessionId: SessionId };
  // 데이터 fetch 는 TanStack Query 로
  ...
};

export const ErrorBoundary = () => {
  const error = useRouteError();
  return <RouteError error={error} />;
};
```

## 4. 경로 설계 원칙

- **URL 은 리소스** — 동작(`/submit`) 대신 리소스(`/matching/:id`).
- **세그먼트 파라미터는 Zod 로 파싱**. 실패 시 `throw new Response(null, { status: 404 })` 로 404 페이지.
- **Query string** 은 `useSearchParams` + Zod. 파싱 실패 시 기본값으로 normalize 후 `replace` 리다이렉트.
- **Hash 라우팅 금지** (`HashRouter`) — SEO/딥링크 파손.
- **Locale prefix** (`/ko`, `/en`) 는 현 범위에서 쓰지 않는다. i18n 은 컴포넌트 레벨.

## 5. Loader 정책 — TanStack Query 와 역할 분리

| 무엇을 | 어디에 |
|---|---|
| URL/쿼리 파라미터 검증/정규화 | **loader** |
| 인증 가드 (리다이렉트) | **loader** |
| 조회용 데이터 fetch | **TanStack Query** (`useSuspenseQuery` 권장) |
| 뮤테이션 (POST/PUT/DELETE) | **TanStack Query mutation** |
| 페이지 메타(title, og) | **React 19 `<title>`** 또는 `handle.meta` |

**왜**: React Query 는 캐시·리페치·옵티미스틱·리트라이를 일원화한다. Loader 는 “라우트 진입 조건” 에만 집중 → 이중 캐시/이중 에러 처리 제거.

Loader preload 보조:
```tsx
{
  path: 'matching/:sessionId',
  lazy: () => import('@pages/MatchingSession'),
  loader: async ({ params }) => {
    const id = SessionIdParam.parse(params.sessionId);
    // 사전 캐시 warm-up
    void queryClient.prefetchQuery(sessionQueries.detail(id));
    return { sessionId: id };
  },
}
```

## 6. 인증 가드 패턴

```ts
// src/features/auth/model/guards.ts
import { redirect } from 'react-router';
import { useAuthStore } from '@shared/stores/auth';

export const requireAuth = async () => {
  const token = useAuthStore.getState().token;
  if (!token) throw redirect('/login');
  return null;
};

export const redirectIfAuthed = async () => {
  const token = useAuthStore.getState().token;
  if (token) throw redirect('/my');
  return null;
};
```

- 가드는 **loader 단계에서만** 수행. 컴포넌트 렌더 이후 redirect 금지(깜빡임).
- 토큰 재발급(refresh) 은 axios 인터셉터에서 단일 경로로 처리(→ `data-tanstack-axios-zod`).

## 7. Error / Not-Found / Suspense 경계

- **루트 `errorElement`**: 최후 안전망. (500 급, 예기치 못한 Throw)
- **라우트 `ErrorBoundary`**: 404/세션 만료/권한 등 라우트 고유 에러.
- **피처 수준**: `react-error-boundary` 로 감싸서 위젯 단위 격리.
- **Suspense fallback**: 라우트 진입 시 `<RouteSkeleton />` — 페이지 레이아웃을 보존한 스켈레톤으로.

```tsx
<Suspense fallback={<RouteSkeleton />}>
  <Outlet />
</Suspense>
```

## 8. 스크롤/포커스 관리

- 페이지 전환 시 기본적으로 **스크롤 top**, 단 뒤로가기 시 브라우저 복원 존중.
- **포커스**를 `<h1>` 또는 메인 콘텐츠로 이동시켜 스크린리더 호환성 확보.

```tsx
// src/app/layouts/RootLayout.tsx
useEffect(() => {
  const h1 = document.querySelector<HTMLElement>('main h1');
  h1?.focus({ preventScroll: true });
}, [location.pathname]);
```

## 9. 링크/내비게이션

- **내부 이동**은 `<Link>` / `<NavLink>` — `<a href>` 직접 사용 금지.
- **외부 링크**는 `<a href target="_blank" rel="noopener noreferrer">` 고정.
- **Prefetch**: 뷰포트 진입 후 `<Link prefetch="intent">` — v7 의 내장 힌트 사용.

## 10. 배포 레이어 정합 (CloudFront + S3)

- S3: 정적 호스팅 활성화, 루트 `index.html`.
- CloudFront:
  - **Default root object**: `index.html`.
  - **Custom error responses**: 403/404 → 200 with `/index.html`.
  - **Cache behavior**: `/assets/*` 는 장기 캐시(`immutable, max-age=31536000`), `/index.html` 은 `no-cache`.
  - **Origin Shield**: ICN (한국 대기 시간 단축).
  - **WAF**: managed rule — XSS/SQLi 기본 방어.
- **Staging**: Basic Auth(Lambda@Edge 또는 Function URL), `robots.txt: Disallow: /`, HSTS 동일 적용.

## 11. SEO / 메타데이터

- React 19 에서 `<title>`, `<meta>`, `<link>` 를 컴포넌트 트리에 두면 자동 호이스팅.
- OG 이미지는 CDN 경로 고정. 해시 fingerprint 자산은 `preload` 로 힌트.
- SPA 특성상 SEO 중요 페이지는 **pre-render**(optional, 별도 ADR). 현재는 브랜드 정적 페이지 + Twitter card 정도.

## 12. 품질 게이트

- **Playwright**: 모든 주요 라우트(홈/온보딩/매칭/훈수/마이)의 **네비게이션 + 404 fallback** 테스트.
- **Lighthouse CI**: 페이지별 LCP/CLS/INP 예산.
- **에러 이벤트**: `useRouteError` 를 통해 Sentry 로 `captureException` (→ `observability`).
- **번들 영향**: 각 페이지는 자신만의 chunk 를 생성 — manualChunks 에 혼입 금지.

## 13. 안티패턴

- 라우트 내부에서 `window.location = ...` 직접 변경 — `navigate()` 또는 `redirect()`.
- `Navigate to="/x"` 를 `useEffect` 에서 호출 — loader redirect 로 전환.
- 페이지 컴포넌트에서 전역 fetch 를 `useEffect` 로 실행 — TanStack Query 로 이관.
- `HashRouter` / `MemoryRouter` — 운영 금지.
- 페이지 모듈이 서로의 내부 파일을 import — 각자 `index.ts` 만 노출.
- 한 페이지에서 loader 와 useQuery 가 동일한 데이터를 중복 요청.

## 14. 트러블슈팅

| 증상 | 진단 | 해결 |
|---|---|---|
| 새로고침 시 404 | CloudFront error response 설정 누락 | 403/404 → 200 `/index.html`. |
| `useLoaderData()` 타입이 `unknown` | loader 반환 타입 미추론 | `UIMatch` 제네릭 또는 `as` 지양하고 `satisfies` 사용. |
| lazy chunk 파일 없음(해시 드리프트) | CDN 구버전 HTML 이 신 청크 참조 | `index.html` no-cache + chunk immutable. 배포 시 atomic swap. |
| 뒤로가기 후 스크롤 튐 | 수동 scroll reset | `ScrollRestoration` 사용 또는 `location.state` 로 복원 힌트. |

## 15. References

- [React Router v7 docs](https://reactrouter.com/home)
- [Remix/React Router team — Data Router guide](https://reactrouter.com/start/data/routing)
- [web.dev — SPA routing and UX](https://web.dev/articles/soft-navigations-experiment)
- 내부: [vite-react19](../vite-react19/SKILL.md), [error-suspense-boundary](../error-suspense-boundary/SKILL.md), [data-tanstack-axios-zod](../data-tanstack-axios-zod/SKILL.md)
