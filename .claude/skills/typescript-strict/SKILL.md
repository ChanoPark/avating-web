---
name: typescript-strict
description: TypeScript 5 strict 구성 — 컴파일러 옵션, 경로 별칭, 타입 안전 규칙, 경계 검증 전략 (avating-web 전용)
version: 2.0.0
source:
  - CLAUDE.md#기술-스택
  - CLAUDE.md#품질-기준-CI에서-강제
  - .claude/plans/project-setup-plan.md
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# TypeScript 5 Strict

아바팅 웹의 **타입 안전 기준선**. 이 문서를 만족하지 않는 PR 은 CI 에서 차단된다.

## 1. Scope & Non-goals

### 적용 범위
- 모든 `src/**/*.{ts,tsx}` 파일 (테스트 포함).
- 스크립트/도구 `scripts/**/*.ts`.
- 설정 파일 `*.config.ts` (vite, vitest, eslint, playwright, storybook).

### 비적용 / 예외
- 3rd-party `.d.ts` 수정 금지 — 필요 시 `src/shared/types/<lib>.d.ts` 에 **augmentation** 으로 추가.
- 생성 코드(`src/shared/api/generated/*.ts`)는 ESLint `overrides` 로 일부 규칙 완화, 그러나 `strict` 는 유지.

## 2. Runtime & Toolchain

| 항목 | 값 | 이유 |
|---|---|---|
| Node.js | `22.x` LTS | React 19 / Vite 6 공식 요구. `.nvmrc` + corepack 고정. |
| TypeScript | `^5.6` | `satisfies`, `const` type params, Zod 4 호환. |
| Package manager | `pnpm@9` | workspace 우회 방지, `packageManager` 필드 고정. |

```
# .nvmrc
22
# package.json
"packageManager": "pnpm@9.12.0",
"engines": { "node": ">=22.0.0 <23", "pnpm": ">=9" }
```

## 3. tsconfig 설계 (baseline → app/test 분리)

**루트 `tsconfig.base.json`** — 공통 컴파일러 옵션만. Emit 은 하지 않는다.

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,

    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,

    "baseUrl": ".",
    "paths": {
      "@/*":         ["src/*"],
      "@app/*":      ["src/app/*"],
      "@pages/*":    ["src/pages/*"],
      "@features/*": ["src/features/*"],
      "@entities/*": ["src/entities/*"],
      "@shared/*":   ["src/shared/*"]
    }
  },
  "exclude": ["node_modules", "dist", "coverage", "storybook-static", "playwright-report"]
}
```

**`tsconfig.app.json`** — 실제 앱 컴파일.

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "src/**/*.json"]
}
```

**`tsconfig.node.json`** — 빌드/설정 파일.

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node", "vitest/importMeta"]
  },
  "include": ["vite.config.ts", "vitest.config.ts", "eslint.config.ts", "playwright.config.ts", ".storybook/**/*"]
}
```

**루트 `tsconfig.json`** — project references.

```jsonc
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

> 왜 분리하는가: Microsoft TS 팀이 권장하는 **Project References** 로 빌드 그래프가 분리되고, 설정 파일(node 환경)과 앱 코드(브라우저 환경)의 `types` 충돌을 차단한다.

## 4. 컴파일러 플래그의 이유 (근거)

| 플래그 | 이유 |
|---|---|
| `strict` | 전 strict 계열 on. 기본 안전망. |
| `noUncheckedIndexedAccess` | `arr[i]` 의 반환 타입을 `T \| undefined` 로 강제 — 아바타/세션 배열 접근에서 null-safety 보장. |
| `exactOptionalPropertyTypes` | 선택 프로퍼티 `x?: T` 에 `undefined` 명시 전달 차단. React props 에서 “누락” vs “명시적 undefined” 혼동 제거. |
| `noImplicitOverride` | 클래스 상속 드리프트 차단 (에러 클래스 계층 등). |
| `verbatimModuleSyntax` | `import type` / `export type` 명시 — Vite/esbuild 트리셰이킹 정확도 증가. |
| `isolatedModules` | 파일 단위 트랜스파일 전제 — Vite/esbuild/SWC 호환. |
| `noPropertyAccessFromIndexSignature` | `env.FOO` 대신 `env['FOO']` — 오타로 인한 `undefined` 접근 차단. |
| `moduleResolution: bundler` | Vite 가 권장. Conditional exports, subpath imports 정상 해석. |

## 5. 경로 별칭 — 3곳 정합 강제

tsconfig / vite / vitest 세 설정이 일치해야 한다. 드리프트 시 테스트/빌드 결과가 달라진다.

```ts
// vite.config.ts
import path from 'node:path';
import { defineConfig } from 'vite';

const alias = {
  '@':         path.resolve(__dirname, 'src'),
  '@app':      path.resolve(__dirname, 'src/app'),
  '@pages':    path.resolve(__dirname, 'src/pages'),
  '@features': path.resolve(__dirname, 'src/features'),
  '@entities': path.resolve(__dirname, 'src/entities'),
  '@shared':   path.resolve(__dirname, 'src/shared'),
};

export default defineConfig({ resolve: { alias } });
```

```ts
// vitest.config.ts 는 vite.config.ts 를 mergeConfig 로 상속 — alias 재정의 금지.
```

ESLint `boundaries` 플러그인의 `settings.boundaries/elements` 도 **동일 경로 패턴** 을 사용해야 한다. (→ `code-quality` 스킬 참조)

## 6. 경계(Boundary) 검증 원칙

외부 경계를 넘는 데이터는 반드시 **Zod 로 파싱**. `as` 단언, `any` 로의 탈출 금지.

```ts
// 잘못된 패턴
const res = await fetch('/api/avatar');
const data = (await res.json()) as Avatar; // 런타임 타입 미검증

// 올바른 패턴
const res = await fetch('/api/avatar');
const json = await res.json();
const data = Avatar.parse(json); // ZodError 시 ErrorBoundary 로 위임
```

대상:
1. HTTP 응답 (`axios`, `fetch`) — `data-tanstack-axios-zod` 참조.
2. WebSocket 메시지.
3. `localStorage` / `sessionStorage` / IndexedDB 읽기.
4. URL search params, path params (React Router).
5. postMessage, BroadcastChannel.
6. 환경변수 (`import.meta.env`).

## 7. 타입 디자인 규칙

### 7.1 Domain model
- **Zod 스키마를 단일 진실 공급원으로**. 타입은 `z.infer` 로 유도.
- 스키마 위치: `src/entities/<domain>/model.ts`.

```ts
// src/entities/avatar/model.ts
import { z } from 'zod';

export const AvatarId = z.string().uuid().brand<'AvatarId'>();
export type AvatarId = z.infer<typeof AvatarId>;

export const Avatar = z.object({
  id: AvatarId,
  nickname: z.string().min(1).max(24),
  persona: z.object({
    mbti: z.string().regex(/^[EI][SN][TF][JP]$/),
    tags: z.array(z.string()).max(10),
  }),
  createdAt: z.coerce.date(),
});
export type Avatar = z.infer<typeof Avatar>;
```

### 7.2 Branded types
- 외부 ID(UUID, 세션ID, 다이아ID)는 `z.brand<...>()` 로 교차 사용 차단.
- 가격/수량은 `z.number().int().nonnegative().brand<'Diamonds'>()`.

### 7.3 판별 유니온 (Discriminated Union)
상태 표현은 반드시 판별 유니온. boolean flag 혼용 금지.

```ts
type SessionState =
  | { status: 'idle' }
  | { status: 'running'; turn: number; sessionId: SessionId }
  | { status: 'paused'; reason: 'user' | 'timeout' }
  | { status: 'ended'; outcome: 'matched' | 'rejected' | 'expired' };
```

### 7.4 `satisfies` vs 타입 애너테이션
- 리터럴 구조 검증 + 정확한 좁은 타입 유지: `satisfies`.
- 외부 export 시: 명시적 타입 애너테이션.

```ts
export const ROUTES = {
  home: '/',
  matching: '/matching/:sessionId',
  mypage: '/my',
} as const satisfies Record<string, `/${string}`>;
```

### 7.5 에러 타입
- 도메인 에러는 클래스 + tagged discriminator:

```ts
export class MatchingError extends Error {
  readonly _tag = 'MatchingError' as const;
  constructor(
    message: string,
    readonly cause?: { code: 'QUOTA' | 'BLOCKED' | 'NETWORK'; retryable: boolean },
  ) { super(message); this.name = 'MatchingError'; }
}
```

## 8. `import` / `export` 규칙

- **순수 타입만 사용하면 `import type`** — `verbatimModuleSyntax` 강제.
- Barrel(`index.ts`) 은 **layer 진입점만** 허용 (`shared/ui/index.ts`). 내부 폴더 전반에 배럴 금지 — 트리셰이킹/순환 의존 위험.
- `export default` 금지 (Next/Storybook 요구 파일 제외) — 이름 기반 re-export 로 고정 메타데이터.
- 순환 import 금지 — ESLint `import/no-cycle` 로 검출.

## 9. 유틸 타입 규칙

자주 쓰는 축약:

```ts
// src/shared/types/util.ts
export type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type NonEmptyArray<T> = readonly [T, ...T[]];
export type ValueOf<T> = T[keyof T];
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;
```

- `any` 대체는 **대부분 `unknown`**. `Record<string, unknown>` 으로 오브젝트 기본형.
- `Function` 대신 구체적 시그니처. `object` 대신 `Record<string, unknown>`.

## 10. CI 게이트 (강제)

`package.json`:
```json
{
  "scripts": {
    "typecheck": "tsc -b --pretty",
    "typecheck:watch": "tsc -b --watch --preserveWatchOutput"
  }
}
```

GitHub Actions:
```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm typecheck
```

실패 조건:
- 에러 1건 이상 → 실패.
- `@ts-ignore` / `@ts-expect-error` 사용 시 **사유 코멘트** 없으면 ESLint 룰(`@typescript-eslint/ban-ts-comment`) 이 실패.

## 11. 안티패턴 (PR 차단 대상)

1. `any` 사용 (명시/암시). 경계 데이터는 `unknown` + Zod.
2. 런타임 데이터에 대한 `as T` 단언.
3. `interface I {}` (빈 인터페이스) — 불필요.
4. `enum` — string literal union + `const satisfies` 로 대체.
5. 타입 기준 폴더링 (`types/`, `interfaces/`) — 도메인/기능 기준으로 분리.
6. 순환 import.
7. 기본 `export default`.
8. 외부 `.d.ts` 를 직접 수정.

## 12. 트러블슈팅

| 증상 | 원인 후보 | 해결 |
|---|---|---|
| `Cannot find module '@/...'` | vite alias ↔ tsconfig paths 불일치 | alias 3곳 동기화. |
| `exactOptionalPropertyTypes` 로 props 전달 실패 | `prop={maybeX}` 에서 `maybeX: string \| undefined` | `...(maybeX && { prop: maybeX })` 조건부 스프레드. |
| Zod 4 타입이 너무 느림 | 깊은 스키마의 재귀 inference | `z.lazy` + 별도 타입 애너테이션. |
| Vitest 에서만 `tsc` 에러 | test 전용 타입 누락 | `tsconfig.app.json` 의 `include` 에 `**/*.test.ts` 포함 확인. |

## 13. References

- [TypeScript: Do's and Don'ts (Microsoft)](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [TypeScript 5.6 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-6/)
- [Vite — TypeScript](https://vitejs.dev/guide/features.html#typescript)
- [total-typescript.com — Type flags](https://www.totaltypescript.com/tsconfig-cheat-sheet) (Matt Pocock)
- 내부: [CLAUDE.md](../../../CLAUDE.md), [.claude/plans/project-setup-plan.md](../../plans/project-setup-plan.md)
