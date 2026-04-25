---
name: client-state-zustand
description: Zustand — UI/인증 토글 전용 슬라이스, 선택자·미들웨어·영속화·셀렉터 안전성, 서버 상태와의 역할 분리
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(클라이언트-상태)
  - CLAUDE.md#개발-규칙(서버-클라-상태-분리)
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# Zustand — Client-Only State

## 1. 역할 정의 (Non-negotiable)

Zustand 는 **클라이언트 전용** 상태만 담는다.

| Allowed | Disallowed |
|---|---|
| 인증 토큰/세션 (메모리 + 재발급 로직) | 서버에서 조회한 아바타/세션/메시지 데이터 |
| 전역 UI 토글(모달, 사이드패널, 테마) | 폼 입력 상태(RHF 사용) |
| 온보딩 위저드 진행도 | 페이지-스코프 UI 상태(useState) |
| 토스트 큐 | 서버 작업 결과 캐시 |

**이유**: 서버 데이터와 클라이언트 상태를 동시에 저장하면 두 개의 진실 공급원이 생긴다. 캐시 무효화·옵티미스틱·리트라이가 TanStack Query 와 충돌 → 디버깅 불가.

## 2. Install

```bash
pnpm add zustand
```

## 3. Store 설계 — 슬라이스 패턴 (pmndrs 권장)

각 도메인(auth, ui, onboarding) 을 **슬라이스로 나누고, 하나의 스토어로 결합**하거나 도메인별 독립 스토어로 분리. 본 프로젝트는 **도메인별 독립 스토어 + 슬라이스 내부 구조** 를 사용한다.

```ts
// src/shared/stores/auth.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { http } from '@shared/api/http';

type Role = 'guest' | 'member' | 'premium';

interface AuthState {
  token: string | null;
  role: Role;
  userId: string | null;
  expiresAt: number | null;

  setToken: (token: string, expiresAt: number, userId: string, role: Role) => void;
  clear: () => void;
  refresh: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      token: null,
      role: 'guest',
      userId: null,
      expiresAt: null,

      setToken: (token, expiresAt, userId, role) => set({ token, expiresAt, userId, role }),
      clear: () => set({ token: null, expiresAt: null, userId: null, role: 'guest' }),

      refresh: async () => {
        try {
          const { data } = await http.post('/auth/refresh', {}, { withCredentials: true });
          const parsed = AuthSession.parse(data);
          set({ token: parsed.token, expiresAt: parsed.expiresAt });
          return parsed.token;
        } catch {
          get().clear();
          return null;
        }
      },
    })),
    { name: 'auth-store' },
  ),
);
```

## 4. 선택자(Selector) 규칙

Zustand 의 가장 큰 실수: **객체 전체 구독**. 리렌더 폭증의 원인.

```ts
// ❌ 전체 구독 — 다른 필드 바뀌면 재렌더
const auth = useAuthStore();

// ❌ 구조분해 destructuring — 매 호출 새 객체
const { token, role } = useAuthStore();

// ✅ 필드별 개별 셀렉터
const token = useAuthStore((s) => s.token);
const role  = useAuthStore((s) => s.role);

// ✅ 필요 시 shallow 로 여러 필드 묶기
import { useShallow } from 'zustand/react/shallow';
const { token, role } = useAuthStore(useShallow((s) => ({ token: s.token, role: s.role })));
```

### 셀렉터 상수화
빈번히 쓰는 셀렉터는 모듈 스코프 상수로:

```ts
export const selectIsAuthed = (s: AuthState) => Boolean(s.token);
// 사용처
const isAuthed = useAuthStore(selectIsAuthed);
```

## 5. UI 스토어 (예: 토스트 큐)

```ts
// src/shared/stores/toast.ts
import { create } from 'zustand';

interface Toast { id: string; kind: 'success' | 'error' | 'info'; message: string; }

interface ToastState {
  queue: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  queue: [],
  push: (t) => set((s) => ({ queue: [...s.queue, { ...t, id: crypto.randomUUID() }] })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),
}));

// 사용 편의 래퍼
export const toast = {
  success: (message: string) => useToastStore.getState().push({ kind: 'success', message }),
  error:   (message: string) => useToastStore.getState().push({ kind: 'error', message }),
  info:    (message: string) => useToastStore.getState().push({ kind: 'info', message }),
};
```

## 6. Persist — 허용 범위와 보안

- **허용**: 테마, 튜토리얼 완료 여부, 마지막 본 페이지 등 **비민감 UI 상태**.
- **불허**: 인증 토큰, 결제 정보, 개인정보. 서비스워커 캐시/공격 표면 확대 우려.

```ts
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      tutorialSeen: false,
      setTheme: (theme) => set({ theme }),
      markTutorialSeen: () => set({ tutorialSeen: true }),
    }),
    {
      name: 'avating.ui',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme, tutorialSeen: s.tutorialSeen }),
      migrate: (persisted, version) => {
        if (version === 0) { /* v0 → v1 마이그레이션 */ }
        return persisted as UIState;
      },
    },
  ),
);
```

## 7. 미들웨어 가이드

| 미들웨어 | 사용 케이스 |
|---|---|
| `devtools` | 모든 스토어. production 에서 자동 off. |
| `subscribeWithSelector` | 라우터 가드, axios 인터셉터 등 React 밖에서 구독 필요 시. |
| `persist` | UI 상태에 한해 |
| `immer` | 복잡 중첩 트리 편집 시 제한적으로. 기본은 얕은 스프레드로 충분. |

**주의**: 미들웨어 중첩 순서는 `devtools(persist(subscribeWithSelector(...)))` 권장 — devtools 가 최외곽.

## 8. 서브스크립션 (React 밖에서)

```ts
// axios 인터셉터에서 토큰 변경 반응 — 예: 리프레시 후 재시도 큐 플러시
useAuthStore.subscribe(
  (s) => s.token,
  (newToken) => { if (newToken) flushRetryQueue(); },
);
```

## 9. 액션 명명 / 구조 규칙

- `set<X>` / `add<X>` / `remove<X>` / `clear` / `toggle<X>` — 동사 + 명사.
- 비동기 액션은 `async` 로 명시, 스토어 내부에서 axios 호출 허용되지만 **서버 데이터 결과를 state 에 저장 금지**. 결과는 반환하고 호출자가 TanStack Query 로 전달.
- **셀렉터는 pure** — 내부에서 http 호출 등 부작용 금지.

## 10. React 컴포넌트에서 사용 레시피

```tsx
// 단일 필드
const token = useAuthStore((s) => s.token);

// 액션
const clear = useAuthStore((s) => s.clear);

// 여러 필드 + 파생
const { isAuthed, isPremium } = useAuthStore(
  useShallow((s) => ({ isAuthed: !!s.token, isPremium: s.role === 'premium' })),
);
```

컴포넌트 외부에서 즉시 접근:
```ts
const snapshot = useAuthStore.getState();
useAuthStore.setState({ token: null });
```

## 11. 테스트

- 각 테스트 전 `useAuthStore.setState({ ...initial })` 로 초기화.
- 또는 스토어 팩토리로 주입 가능하게 설계:
  ```ts
  export const createAuthStore = () => create<AuthState>()(...);
  ```
- DOM 테스트: Provider 없이 사용 가능(= 장점). 하지만 격리가 필요하면 팩토리 + Provider 패턴 채택.

## 12. 안티패턴

- 서버 응답을 `set({ items: data })` — 금지. TanStack Query 로.
- `useEffect` 에서 `useXStore.getState()` 수동 동기화 — 셀렉터로 대체.
- 하나의 거대한 `useAppStore` 에 모든 도메인 합치기 — 도메인별 분리.
- 상태 변이(`state.list.push(...)`) — `set((s) => ({ list: [...s.list, x] }))` 형태 필수.
- Persist 로 민감정보 저장.

## 13. 마이그레이션 체크리스트

- 기존 Context 로 전파되던 UI 토글 → Zustand 로 이관.
- `Redux Toolkit` 사용 시 reducer 구조를 slice 스토어로 1:1 매핑 후 제거.

## 14. References

- [Zustand docs](https://zustand.docs.pmnd.rs)
- [pmndrs — Zustand Patterns](https://github.com/pmndrs/zustand/blob/main/docs/guides/slices-pattern.md)
- TkDodo: ["Don't Over-useState"](https://tkdodo.eu/blog/dont-over-use-state) (Zustand 원칙과 맥락 동일)
- 내부: [data-tanstack-axios-zod](../data-tanstack-axios-zod/SKILL.md)
