---
name: data-tanstack-axios-zod
description: TanStack Query v5 + Axios + Zod — 서버 상태 표준, 쿼리키 팩토리, 인터셉터/토큰 갱신, 뮤테이션 무효화, Suspense 모드, 실시간/폴링 전략
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(서버-상태)
  - CLAUDE.md#개발-규칙
scope: avating-web
authority: MUST
maintainer: frontend-core
references_by:
  - react-router-spa
  - forms-rhf-zod
  - observability-sentry-amplitude
---

# TanStack Query v5 + Axios + Zod

> **단일 원칙**: 서버 데이터의 생애 주기는 TanStack Query 가 전부 관리한다. 컴포넌트·Zustand·Context 는 서버 데이터를 보유하지 않는다.
> (TkDodo 의 “Don't put server state in the client state” 원칙. Netflix·Vercel·Shopify 패턴과 동일.)

## 1. Install

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools axios zod
pnpm add -D @tanstack/eslint-plugin-query msw
```

`eslint-plugin-query` 는 `exhaustive-deps`, `no-rest-destructuring`, `stable-query-client` 등 주요 실수를 잡아준다.

## 2. QueryClient — 전역 구성

```ts
// src/app/providers/queryClient.ts
import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { toast } from '@shared/ui/Toast';
import { captureError } from '@shared/lib/observability';
import { isAppError } from '@shared/lib/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,                 // 공용 기본값 — 도메인별로 override
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (isAppError(error) && error.retryable === false) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
      throwOnError: (error) => !isAppError(error) || error.fatal === true,
    },
    mutations: {
      retry: 0,
      throwOnError: false,
    },
  },
  queryCache: new QueryCache({
    onError: (err, query) => {
      captureError(err, { scope: 'query', queryKey: query.queryKey });
    },
  }),
  mutationCache: new MutationCache({
    onError: (err) => {
      captureError(err, { scope: 'mutation' });
      toast.error('요청이 실패했습니다. 잠시 후 다시 시도해 주세요.');
    },
  }),
});
```

**Provider 주입**:
```tsx
// src/app/providers/QueryProvider.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './queryClient';

export const QueryProvider = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);
```

## 3. Axios Client — 인터셉터 + 토큰 갱신

```ts
// src/shared/api/http.ts
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { env } from '@shared/config/env';
import { useAuthStore } from '@shared/stores/auth';
import { AppError, toAppError } from '@shared/lib/errors';

export const http = axios.create({
  baseURL: env.VITE_API_BASE,
  timeout: 8_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Request: 토큰, 요청 ID, locale
http.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  cfg.headers['X-Request-Id'] = crypto.randomUUID();
  cfg.headers['Accept-Language'] = navigator.language || 'ko-KR';
  return cfg;
});

// Response: 에러 정규화 + 401 토큰 재발급
let refreshPromise: Promise<string | null> | null = null;

http.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as AxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshPromise ??= useAuthStore.getState().refresh();
      const newToken = await refreshPromise.finally(() => { refreshPromise = null; });
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return http(original);
      }
    }
    return Promise.reject(toAppError(err));
  },
);
```

### 에러 정규화

```ts
// src/shared/lib/errors.ts
import { z } from 'zod';
import type { AxiosError } from 'axios';

export const ServerError = z.object({
  code: z.string(),
  message: z.string(),
  retryable: z.boolean().default(false),
  details: z.record(z.unknown()).optional(),
});
export type ServerError = z.infer<typeof ServerError>;

export class AppError extends Error {
  readonly _tag = 'AppError' as const;
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
    readonly status?: number,
    readonly cause?: unknown,
  ) { super(message); this.name = 'AppError'; }
  get fatal() { return this.status !== undefined && this.status >= 500; }
}

export const isAppError = (e: unknown): e is AppError =>
  typeof e === 'object' && e !== null && (e as { _tag?: string })._tag === 'AppError';

export const toAppError = (err: AxiosError): AppError => {
  const parsed = ServerError.safeParse(err.response?.data);
  if (parsed.success) {
    return new AppError(parsed.data.message, parsed.data.code, parsed.data.retryable, err.response?.status, err);
  }
  if (err.code === 'ECONNABORTED') return new AppError('요청 시간이 초과되었습니다', 'TIMEOUT', true);
  return new AppError('네트워크 오류', 'NETWORK', true, err.response?.status, err);
};
```

## 4. Query Key Factory — 계층적 키

```ts
// src/entities/avatar/keys.ts
import type { AvatarId } from './model';

export const avatarKeys = {
  all: ['avatar'] as const,
  lists: () => [...avatarKeys.all, 'list'] as const,
  list: (filter: { persona?: string; cursor?: string }) =>
    [...avatarKeys.lists(), filter] as const,
  details: () => [...avatarKeys.all, 'detail'] as const,
  detail: (id: AvatarId) => [...avatarKeys.details(), id] as const,
};
```

### 규칙
- **매직 문자열 금지** — 모든 쿼리키는 factory.
- 키는 **얕음 → 깊음** 순서로 hierarchical. 무효화 시 prefix 전달.
- 동일 리소스에 대한 detail/list 접근은 동일 factory.

## 5. Query / Mutation 훅 표준

### 5.1 Query 훅 (Zod 파싱 필수)
```ts
// src/entities/avatar/api.ts
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { Avatar, AvatarId } from './model';
import { avatarKeys } from './keys';

export const fetchAvatar = async (id: AvatarId): Promise<Avatar> => {
  const { data } = await http.get(`/avatars/${id}`);
  return Avatar.parse(data); // ZodError → ErrorBoundary
};

export const useAvatar = (id: AvatarId) =>
  useQuery({
    queryKey: avatarKeys.detail(id),
    queryFn: () => fetchAvatar(id),
    staleTime: 60_000,
  });

// Suspense mode — 라우트 경계와 결합해 사용
export const useSuspenseAvatar = (id: AvatarId) =>
  useSuspenseQuery({
    queryKey: avatarKeys.detail(id),
    queryFn: () => fetchAvatar(id),
  });
```

### 5.2 Infinite query
```ts
export const useAvatarList = (filter: { persona?: string }) =>
  useInfiniteQuery({
    queryKey: avatarKeys.list(filter),
    queryFn: async ({ pageParam }) => {
      const { data } = await http.get('/avatars', { params: { ...filter, cursor: pageParam } });
      return AvatarPage.parse(data);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? null,
  });
```

### 5.3 Mutation + 무효화
```ts
export const useInvokeIntervention = (sessionId: SessionId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InterventionInput) =>
      http.post(`/sessions/${sessionId}/interventions`, payload).then((r) => Intervention.parse(r.data)),

    // 낙관적 업데이트
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: sessionKeys.detail(sessionId) });
      const prev = qc.getQueryData<SessionDetail>(sessionKeys.detail(sessionId));
      qc.setQueryData<SessionDetail>(sessionKeys.detail(sessionId), (cur) =>
        cur ? { ...cur, interventions: [...cur.interventions, toOptimistic(payload)] } : cur,
      );
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(sessionKeys.detail(sessionId), ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      qc.invalidateQueries({ queryKey: diamondKeys.balance() }); // 다이아 잔액 갱신
    },
  });
};
```

### 5.4 훅 레이어 규칙
- `entities/*/api.ts` — 원시 fetch 함수 + 단일 resource 훅.
- `features/*/api.ts` — 복합 유스케이스(여러 엔티티 조합) 훅.
- 훅 이름: `use<Resource>`, `use<Resource>List`, `useCreate<Resource>`, `useUpdate<Resource>`, `useDelete<Resource>`.

## 6. Zod 경계 검증 원칙

- **응답**은 무조건 `Schema.parse(data)`. `any`/`as`/`unknown` 통과 금지.
- 요청 바디는 서버로 보내기 직전 한 번 더 `parse` 해 송신 정합성 보장(결제/민감 유즈케이스).
- **스키마 버전 드리프트** 방지: OpenAPI/JSON Schema → Zod 자동 변환을 검토하되, 최종 스키마는 레포에 커밋.
- 민감 필드: 메시지 본문, 닉네임 등 PII 는 파싱 후 **Sentry 스크러빙 파이프라인에 들어가도록 명시**(→ `observability`).

## 7. Suspense 모드 + Error Boundary

```tsx
<ErrorBoundary FallbackComponent={SessionError} onReset={() => queryClient.invalidateQueries()}>
  <Suspense fallback={<SessionSkeleton />}>
    <SessionView sessionId={id} /> {/* 내부에서 useSuspenseQuery */}
  </Suspense>
</ErrorBoundary>
```

- `throwOnError` 를 선택적으로 on — 치명적 에러만 경계로 위임.
- 낙관적 흐름/폼 제출 등은 `throwOnError: false` + 컴포넌트 내 인라인 에러.

## 8. Polling / Realtime 전략

| 유형 | 수단 | 선택 기준 |
|---|---|---|
| 세션 진행 상태 | `refetchInterval` (동적 2s ~ 15s) | 단순, 저빈도 업데이트 |
| 라이브 훈수 피드 | WebSocket + `queryClient.setQueryData` | 고빈도, 양방향 |
| 푸시 트리거 | Server-Sent Events | 단방향, 방화벽 친화적 |

WebSocket 메시지 처리:
```ts
socket.on('intervention.created', (raw) => {
  const event = InterventionEvent.parse(raw); // Zod
  queryClient.setQueryData<SessionDetail>(sessionKeys.detail(event.sessionId), (cur) =>
    cur ? { ...cur, interventions: [...cur.interventions, event.intervention] } : cur,
  );
});
```

## 9. Cancellation / Race Condition

- Query 는 signal 을 axios 에 전달해 자동 취소:
  ```ts
  queryFn: ({ signal }) => http.get('/x', { signal }).then((r) => X.parse(r.data)),
  ```
- 빠른 연속 입력(검색) → `keepPreviousData` 및 `staleTime` 로 깜빡임 제거.

## 10. Prefetch / Preload

- 라우트 loader 에서 `queryClient.prefetchQuery`.
- hover/intent 기반 prefetch (`<Link prefetch="intent">` 또는 커스텀 훅).
- SSR 복원은 사용하지 않으나, `hydrate` API 는 장래 옵션.

## 11. 테스트 원칙

- 훅 단위: `vitest + @testing-library/react` + **테스트용 QueryClient** 매 테스트마다 새로 생성.
  ```ts
  const createTestClient = () => new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  ```
- 네트워크는 **MSW** 로만. `axios-mock-adapter` 금지.
- 에러 경로: 4xx/5xx/Timeout/Zod 실패 각각 케이스.

## 12. 성능 / 메모리

- 큰 배열은 `select` 로 서버 응답을 최소 뷰 모델로 변환 — 재렌더 줄이기.
- `structuralSharing` 기본 on — 불변 업데이트 이점 유지.
- 페이지 이탈 시 특정 쿼리는 `gcTime` 을 짧게(세션 민감 데이터).

## 13. 민감정보 / 보안

- 인증 토큰은 HttpOnly 쿠키 우선 — 불가피하게 메모리 저장 시 persist 금지.
- 결제 관련 API 는 **서버 서명** 기반. 클라이언트가 금액/상품 ID 를 변조하지 못하도록 백엔드 재검증.
- Axios `withCredentials: true` 시 CORS 정책/CSRF 토큰 병행.

## 14. 안티패턴

- `useEffect` + `fetch` / `axios` — 모두 `useQuery/useMutation` 으로.
- 컴포넌트 렌더 중 http 호출 — 금지(side effect).
- 서버 데이터를 Zustand/Context 에 복제.
- 응답을 `any` 로 받아 쓴다.
- 전역 `QueryClient` 를 여러 개 생성.
- 매직 문자열 쿼리키.
- 뮤테이션 후 `invalidateQueries` 없이 UI 만 수동 업데이트.
- `onSuccess` 에서 UI 토스트/네비게이션 처리 — 컴포넌트/훅 훅커로 위임.

## 15. 트러블슈팅

| 증상 | 원인 | 대응 |
|---|---|---|
| 401 루프 | refresh 가 실패 응답에도 `_retry` 를 재설정 | `refreshPromise` 싱글톤 + 원자적 재시도 |
| 무한 리페치 | `queryKey` 에 매 렌더 새 객체 | factory 로 고정 객체 사용 |
| Zod 실패 빈발 | 백엔드 스펙 드리프트 | 스키마 버저닝 + `safeParse` + Sentry 태깅 |
| 캐시 stale | `invalidateQueries` 누락 | mutation `onSettled` 에 명시 |
| 느린 최초 로딩 | 동시 쿼리 폭주 | `prefetchQuery` + route-level `Suspense` |

## 16. References

- [TanStack Query v5 docs](https://tanstack.com/query/latest)
- TkDodo's blog: ["Practical React Query"](https://tkdodo.eu/blog/practical-react-query), ["Effective React Query Keys"](https://tkdodo.eu/blog/effective-react-query-keys)
- [Axios — interceptors](https://axios-http.com/docs/interceptors)
- [Zod](https://zod.dev/)
- 내부: [react-router-spa](../react-router-spa/SKILL.md), [error-suspense-boundary](../error-suspense-boundary/SKILL.md), [mocking-msw](../mocking-msw/SKILL.md)
