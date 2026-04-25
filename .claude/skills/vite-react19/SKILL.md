---
name: vite-react19
description: Vite 6 + React 19 앱 셋업 — 레이어 아키텍처(FSD 영향), 코드 스플리팅, env 파싱, 번들 예산, 에셋 관리
version: 2.0.0
source:
  - CLAUDE.md#기술-스택
  - CLAUDE.md#프로젝트-구조-원칙
  - CLAUDE.md#환경-및-배포
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# Vite 6 + React 19 — Foundational Setup

## 1. Why Vite 6 / React 19

- **Vite 6**: Environment API, 향상된 SSR 파이프라인(우리는 SPA 만 사용), Rolldown 이행 준비. Lightning CSS 기본.
- **React 19**: `use()` hook, Actions, `useOptimistic`, improved Suspense hoisting, `<Document Metadata>` 네이티브. `@testing-library/react@16` 호환.

**Non-goals**: SSR/RSC 사용하지 않음. 클라이언트 전용 SPA 만 빌드하여 S3 + CloudFront 로 정적 배포한다.

## 2. Install

```bash
pnpm create vite@latest . -- --template react-ts
pnpm add react@^19.0.0 react-dom@^19.0.0
pnpm add -D @types/react@^19 @types/react-dom@^19 @vitejs/plugin-react vite@^6

# 부가 플러그인(이 프로젝트 기준)
pnpm add -D @tailwindcss/vite vite-plugin-svgr @sentry/vite-plugin vite-plugin-checker
```

버전 고정:
- 라이브러리 버전은 `^` 를 유지하되, 메이저 승급은 ADR 작성 후만.
- `pnpm-lock.yaml` 커밋 필수. CI 는 `--frozen-lockfile`.

## 3. Folder Architecture (Feature-Sliced-inspired)

```
src/
├── app/                    # 앱 진입 + 전역 프로바이더 + 라우터
│   ├── main.tsx
│   ├── App.tsx
│   ├── providers/
│   │   ├── QueryProvider.tsx
│   │   ├── RouterProvider.tsx
│   │   └── ObservabilityProvider.tsx
│   ├── router.tsx
│   └── styles/index.css
├── pages/                  # 라우트 페이지 (lazy 대상)
│   ├── Home/{ui,model,index.ts}
│   ├── MatchingSession/{...}
│   └── NotFound/{...}
├── features/               # 도메인 기능 단위
│   ├── onboarding/
│   ├── matching/
│   ├── intervention/       # 훈수
│   └── payment/
│       └── { ui, model, api, lib, index.ts }
├── entities/               # 순수 모델/스키마/쿼리키
│   ├── avatar/{model.ts, keys.ts, index.ts}
│   ├── session/
│   └── diamond/
└── shared/                 # 공통 인프라
    ├── ui/                 # 키트 (Button, Modal, Toast, ...)
    ├── api/                # http client, interceptors
    ├── config/             # env, flags
    ├── lib/                # 범용 유틸
    ├── hooks/
    ├── i18n/
    ├── mocks/              # MSW
    ├── stores/             # Zustand
    └── types/
```

### 레이어 의존 방향 (단방향)
```
app → pages → features → entities → shared
```
역방향 import 금지. **ESLint `boundaries` 플러그인으로 강제**(→ `code-quality`). 위반 시 CI 실패.

### Feature 내부 표준 구성
```
features/matching/
├── ui/                  # 리액트 컴포넌트
├── model/               # 상태 훅, 유스케이스
├── api/                 # TanStack Query 훅, axios 콜
├── lib/                 # 순수 함수
└── index.ts             # public API (barrel) — 외부는 이 파일만 import
```

외부는 `@features/matching` 경로로만 접근. 내부 파일 직접 import 금지 (`import/no-internal-modules`).

## 4. Vite Config (실전 전체)

```ts
// vite.config.ts
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import checker from 'vite-plugin-checker';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const isProd = mode === 'production';
  const isStaging = env.VITE_APP_ENV === 'staging';

  const plugins: PluginOption[] = [
    react({
      babel: {
        plugins: [
          // React Compiler (RC) — 안정화 후 활성화
          // ['babel-plugin-react-compiler', {}],
        ],
      },
    }),
    tailwindcss(),
    svgr({ svgrOptions: { icon: true } }),
    checker({ typescript: true, eslint: { lintCommand: 'eslint "src/**/*.{ts,tsx}"', useFlatConfig: true } }),
  ];

  if (isProd || isStaging) {
    plugins.push(
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: env.VITE_SENTRY_ORG,
        project: env.VITE_SENTRY_PROJECT,
        release: { name: env.VITE_APP_VERSION },
        sourcemaps: { assets: './dist/**' },
      }),
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@':         path.resolve(__dirname, 'src'),
        '@app':      path.resolve(__dirname, 'src/app'),
        '@pages':    path.resolve(__dirname, 'src/pages'),
        '@features': path.resolve(__dirname, 'src/features'),
        '@entities': path.resolve(__dirname, 'src/entities'),
        '@shared':   path.resolve(__dirname, 'src/shared'),
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
    preview: { port: 4173, strictPort: true },
    build: {
      target: 'es2022',
      sourcemap: true,              // Sentry 업로드 후 배포 산출물에서는 제거
      cssCodeSplit: true,
      modulePreload: { polyfill: false },
      reportCompressedSize: false,  // Brotli 는 CloudFront 측에서 평가
      rollupOptions: {
        output: {
          manualChunks: {
            react:    ['react', 'react-dom', 'react-router'],
            query:    ['@tanstack/react-query', 'axios', 'zod'],
            motion:   ['motion'],
            sentry:   ['@sentry/react'],
          },
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION ?? 'dev'),
    },
  };
});
```

### 왜 이 설정인가
- **`target: 'es2022'`**: Safari 16+, Chrome 94+ 커버. Baseline 2023 과 호환.
- **`manualChunks`**: 가장 자주 바뀌는 앱 코드와 벤더 코드 분리 — CDN 캐시 적중률↑ (Meta/Airbnb 이 수년간 검증한 패턴).
- **`sourcemap: true`** + Sentry 플러그인: 업로드 후 `dist/**/*.map` 은 배포 스크립트에서 삭제 → 브라우저 노출 차단.
- **`vite-plugin-checker`**: HMR 중 `tsc` + ESLint 병행 실행. 회귀 즉시 피드백.

## 5. React 19 Entry

```tsx
// src/app/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

async function bootstrap() {
  if (import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true') {
    const { worker } = await import('@shared/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  const root = document.getElementById('root');
  if (!root) throw new Error('#root missing in index.html');

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap().catch((err) => {
  console.error('bootstrap failed', err);
  document.body.innerHTML = '<div role="alert">잠시 후 다시 시도해 주세요.</div>';
});
```

규칙:
- **`StrictMode` 필수** — 이중 효과/이중 마운트로 부작용 조기 발견. 프로덕션에서도 유지.
- **Error Boundary 는 App 루트 + 라우트 + 피처 단위**. (→ `error-suspense-boundary`)
- **MSW 는 DEV 또는 `VITE_USE_MOCK=true` 에서만 로드** — production 번들 제외.

## 6. Code Splitting — 실전 규칙

1. **라우트 단위 lazy 필수**.
   ```tsx
   const Home = lazy(() => import('@pages/Home'));
   ```
2. **무거운 위젯(에디터/차트/결제 SDK)은 `lazy` + `Suspense`** 로 격리.
3. **Above-the-fold UI 는 절대 lazy 하지 않는다** — LCP 회귀.
4. **명시적 chunk 이름**: dynamic import 시 `/* @vite-chunkName: payment */` 주석 사용 — 캐시 키 안정화.
5. **Preload 힌트**: 다음 라우트 예측 시 `<link rel="prefetch">` 또는 React Router `lazy` 의 자체 prefetch 사용.

## 7. Asset Conventions

```
public/              # 빌드 시 루트로 복사되는 정적 파일 (favicon, robots.txt)
src/shared/assets/   # 번들되는 이미지/SVG/폰트
```

- **SVG 아이콘**은 `vite-plugin-svgr` 로 `?react` 쿼리를 붙여 React 컴포넌트로 import.
  ```tsx
  import HeartIcon from '@shared/assets/icons/heart.svg?react';
  ```
- **이미지**: `import thumb from '...'` → Vite 가 fingerprint 부여. 절대 URL 문자열 하드코딩 금지.
- **폰트**: self-host. `font-display: swap` + preload.
- **큰 에셋**(>100KB)은 S3 오리진 + CloudFront 로 offload 를 우선 고려.

## 8. 환경변수 — Zod 파싱 필수

```ts
// src/shared/config/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
  VITE_APP_VERSION: z.string().default('dev'),
  VITE_API_BASE: z.string().url(),
  VITE_USE_MOCK: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_SENTRY_ORG: z.string().optional(),
  VITE_SENTRY_PROJECT: z.string().optional(),
  VITE_AMPLITUDE_KEY: z.string().optional(),
  VITE_GROWTHBOOK_CLIENT_KEY: z.string().optional(),
});

const parsed = EnvSchema.safeParse(import.meta.env);
if (!parsed.success) {
  console.error('[env] invalid environment', parsed.error.flatten().fieldErrors);
  throw new Error('환경 변수 검증 실패 — 부팅 중단');
}
export const env = Object.freeze(parsed.data);
export type Env = typeof env;
```

규칙:
- **클라이언트에 노출되는 값은 `VITE_` 접두사**. 나머지는 자동으로 제거 (Vite 동작).
- **비밀값 금지** — 결제 서명/OAuth 시크릿/토큰은 백엔드 위임.
- 부팅 시 검증 실패하면 앱을 **크래시** — 조용한 실패 금지.
- env 파일 우선순위: `.env.local` > `.env.[mode]` > `.env`. `.env.local` 은 **절대 커밋 금지** (.gitignore 고정).

## 9. Performance Budget

CI에서 강제:
- `size-limit` 로 **앱 초기 번들(gzip)**: `< 180 KB`.
- 라우트별 번들 + 벤더 청크 합계 예산도 정의.
- LCP < 2.5s / CLS < 0.1 / INP < 200ms — Lighthouse CI.

```json
// .size-limit.json
[
  { "path": "dist/assets/index-*.js", "limit": "180 KB", "gzip": true },
  { "path": "dist/assets/react-*.js", "limit": "60 KB", "gzip": true }
]
```

## 10. React 19 권장 패턴

### 10.1 `use()` for Promises (with Suspense boundary)
```tsx
// 서버 fetch 는 TanStack Query 가 처리하므로, `use()` 는 주로 컨텍스트/프로미스 언래핑에 사용.
const value = use(SomeContext);
```

### 10.2 Actions + `useOptimistic`
훈수(Intervention) 버튼처럼 낙관적 UI 가 자연스러운 영역에서 적극 사용.

```tsx
const [optimistic, addOptimistic] = useOptimistic(messages, (prev, next) => [...prev, next]);
```

### 10.3 Document Metadata (native)
```tsx
<title>아바팅 · 매칭 중</title>
<meta name="description" content="..." />
```
- React 19 는 이를 자동으로 `<head>` 로 호이스팅. `react-helmet` 불필요.

### 10.4 forwardRef 는 더 이상 필요 없음
React 19 부터 함수 컴포넌트에 `ref` 를 prop 으로 직접 받는다. 신규 코드에서는 `forwardRef` 사용 금지.

```tsx
interface Props { children: React.ReactNode; ref?: React.Ref<HTMLButtonElement>; }
export function Button({ ref, children }: Props) {
  return <button ref={ref}>{children}</button>;
}
```

## 11. Browser Support Matrix

| 브라우저 | 최소 | 이유 |
|---|---|---|
| Chrome | 111+ | ES2022, Baseline 2023 |
| Safari (iOS/macOS) | 16.4+ | `matchMedia('(prefers-reduced-motion)')`, Web Animations API |
| Firefox | 115+ | ES2022 |
| Edge | Chromium 기반 최신 |
| IE11 | 미지원 | 폴리필 금지 |

Playwright 매트릭스: **chromium + webkit** 필수 (→ `testing-stack`).

## 12. 부트 시퀀스 체크리스트 (PR 머지 조건)

- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` 모두 통과
- [ ] `dist/` 결과물에 소스맵 존재 + 배포 단계에서 제거 구성
- [ ] 환경변수 스키마 업데이트 시 `.env.example` 동기화
- [ ] 새 라우트/피처 추가 시 `boundaries` 설정에 레이어 명시
- [ ] 번들 예산 초과 시 `manualChunks` 또는 lazy 분리
- [ ] 접근성 점검 (axe) PASS

## 13. 안티패턴

- **SSR/RSC 를 부분 적용**. 본 프로젝트는 SPA 고정.
- **`src/types/` 전용 폴더** — 도메인 기준으로 분리.
- **레이어 역방향 import** — `shared` 가 `features` 를 import.
- **CRA/webpack 잔재** (`process.env.REACT_APP_*`) — 전부 `import.meta.env.VITE_*` 로 교체.
- **글로벌 CSS 에서 Tailwind 유틸을 @apply 로 남용** — 컴포넌트 수준 className 유지.
- **dynamic import 가 없는 거대 페이지 컴포넌트**.
- **CDN 에서 React/ReactDOM 을 따로 로드** — Vite 번들과 버전 드리프트.

## 14. References

- [Vite 6 release notes](https://vitejs.dev/blog/announcing-vite6.html)
- [React 19 blog (React team)](https://react.dev/blog/2024/12/05/react-19)
- [feature-sliced.design](https://feature-sliced.design/) — 레이어드 아키텍처 근간
- [web.dev — Core Web Vitals](https://web.dev/articles/vitals)
- 내부: [CLAUDE.md](../../../CLAUDE.md), [react-router-spa](../react-router-spa/SKILL.md), [code-quality](../code-quality/SKILL.md)
