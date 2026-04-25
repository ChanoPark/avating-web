---
name: observability-sentry-amplitude
description: Sentry(에러·RUM·소스맵·Replay) + Amplitude(제품 분석) — 중앙화된 이벤트 스키마, PII 스크러빙, CSP/소스맵 정책
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(관측성)
  - CLAUDE.md#개발-규칙(민감정보)
scope: avating-web
authority: MUST
maintainer: platform
---

# Observability — Sentry & Amplitude

## 1. 역할 분리

| 도구 | 담당 | 금지 |
|---|---|---|
| **Sentry** | 프론트 에러, Web Vitals(RUM), 세션 Replay(에러시), 릴리즈/커밋 추적 | PII 원문 전송, 중복 로깅 |
| **Amplitude** | 제품 분석(퍼널, 리텐션, 전환) | 에러 수집, 로깅 |
| **ELK (백엔드)** | 서버/인프라 운영 로그 | 웹 RUM 재수집 |

**단 하나의 원칙**: 같은 사건을 두 시스템에 중복 기록하지 않는다. 신호 혼선으로 분석 정확도가 떨어진다.

## 2. Install

```bash
pnpm add @sentry/react @sentry/vite-plugin @amplitude/analytics-browser
```

## 3. Sentry 초기화

```ts
// src/app/observability/sentry.ts
import * as Sentry from '@sentry/react';
import { createBrowserRouter, matchRoutes, useLocation, useNavigationType, createRoutesFromChildren } from 'react-router';
import { useEffect } from 'react';
import { env } from '@shared/config/env';

export const initSentry = () => {
  if (!env.VITE_SENTRY_DSN) return;

  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.VITE_APP_ENV,          // development | staging | production
    release: env.VITE_APP_VERSION,          // sentry-cli 로 업로드된 release 와 일치
    tracesSampleRate: env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: env.VITE_APP_ENV === 'production' ? 0.2 : 0,
    sendDefaultPii: false,
    normalizeDepth: 6,
    autoSessionTracking: true,
    enableTracing: true,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        mask: ['[data-sensitive]'],
      }),
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],
    beforeSend(event, hint) {
      return scrubPII(event);
    },
    beforeBreadcrumb(crumb) {
      if (crumb.category === 'console' && crumb.level !== 'error') return null;
      if (crumb.category === 'fetch' && crumb.data?.url?.includes('/auth/')) {
        crumb.data = { ...crumb.data, request_body: undefined };
      }
      return crumb;
    },
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
    denyUrls: [/^chrome-extension:\/\//],
  });
};
```

### 3.1 PII 스크러빙
```ts
// src/app/observability/scrub.ts
import type { Event } from '@sentry/react';

const PII_KEYS = /(nickname|name|message|content|email|phone|addr|ssn|password|token|auth)/i;
const PII_VALUE_PATTERNS: RegExp[] = [
  /\b\d{6}-\d{7}\b/,                 // 주민번호
  /\b\d{3}-\d{3,4}-\d{4}\b/,         // 전화번호
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, // email
];

const redact = (v: unknown): unknown => {
  if (typeof v === 'string') {
    return PII_VALUE_PATTERNS.some((r) => r.test(v)) ? '[REDACTED]' : v.slice(0, 256);
  }
  if (Array.isArray(v)) return v.map(redact);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, PII_KEYS.test(k) ? '[REDACTED]' : redact(val)]),
    );
  }
  return v;
};

export const scrubPII = (event: Event): Event => {
  if (event.request?.url) {
    event.request.url = event.request.url.replace(/([?&](token|auth|code)=)[^&]+/gi, '$1[REDACTED]');
  }
  event.extra = redact(event.extra) as Record<string, unknown>;
  event.contexts = redact(event.contexts) as Event['contexts'];
  event.breadcrumbs = event.breadcrumbs?.map((b) => ({ ...b, data: redact(b.data) as Record<string, unknown> | undefined }));
  return event;
};
```

**핵심 규칙**:
- **`setUser({ email, phone })` 금지** — 내부 해시 ID 만. `Sentry.setUser({ id: hashedUserId })`.
- 닉네임/메시지 본문 등은 `[REDACTED]` 치환.
- URL 쿼리의 초대코드/토큰도 마스킹.
- **Replay**: `maskAllText: true` + `blockAllMedia: true`. 결제 화면 DOM 은 `data-sensitive` 속성으로 강제 마스킹.

## 4. 소스맵 업로드 정책

- Vite 빌드에서 `sourcemap: true` 로 생성.
- `@sentry/vite-plugin` 이 빌드 후 자동 업로드.
- **배포 시 `dist/**/*.map` 삭제** (S3 업로드 스크립트에서 제외) → 브라우저에서 접근 불가.
- 릴리즈는 `git commit SHA` 와 `package.json` version 결합 → `VITE_APP_VERSION`.

## 5. Amplitude 초기화 + 이벤트 스키마 중앙화

```ts
// src/app/observability/amplitude.ts
import * as amp from '@amplitude/analytics-browser';
import { env } from '@shared/config/env';

export const initAmplitude = () => {
  if (!env.VITE_AMPLITUDE_KEY) return;
  amp.init(env.VITE_AMPLITUDE_KEY, {
    defaultTracking: false,
    minIdLength: 1,
    logLevel: env.VITE_APP_ENV === 'production' ? 0 : 3,
    serverZone: 'EU', // 필요 시 변경
  });
  amp.setGroup('app_env', env.VITE_APP_ENV);
};
```

### 5.1 이벤트 스키마 — `entities/analytics/events.ts`
```ts
// src/entities/analytics/events.ts
import { z } from 'zod';

export const AnalyticsEvents = {
  matching_session_started: z.object({
    sessionId: z.string().uuid(),
    avatarId: z.string().uuid(),
    dramaInjected: z.boolean(),
  }),
  intervention_invoked: z.object({
    sessionId: z.string().uuid(),
    diamondsSpent: z.number().int().nonnegative(),
    type: z.enum(['prompt','blindReveal','waitShorten']),
  }),
  purchase_succeeded: z.object({
    productId: z.string(),
    amount: z.number().int().nonnegative(),
    currency: z.literal('KRW'),
  }),
  purchase_failed: z.object({
    productId: z.string(),
    code: z.string(),
  }),
} as const;

export type AnalyticsEventName = keyof typeof AnalyticsEvents;
export type AnalyticsEventPayload<K extends AnalyticsEventName> = z.infer<(typeof AnalyticsEvents)[K]>;
```

### 5.2 타입 안전 track 래퍼
```ts
// src/shared/lib/analytics.ts
import * as amp from '@amplitude/analytics-browser';
import * as Sentry from '@sentry/react';
import { AnalyticsEvents, type AnalyticsEventName, type AnalyticsEventPayload } from '@entities/analytics/events';

export const track = <K extends AnalyticsEventName>(name: K, payload: AnalyticsEventPayload<K>) => {
  const parsed = AnalyticsEvents[name].safeParse(payload);
  if (!parsed.success) {
    Sentry.withScope((s) => {
      s.setTag('analytics.event', name);
      s.setExtra('errors', parsed.error.flatten());
      Sentry.captureMessage('Invalid analytics payload', 'warning');
    });
    return;
  }
  amp.track(name, parsed.data as Record<string, unknown>);
};

export const identify = (userHashId: string, traits?: { role?: 'member'|'premium'; country?: 'KR'|'JP' }) => {
  amp.setUserId(userHashId);
  if (traits) {
    const id = new amp.Identify();
    for (const [k, v] of Object.entries(traits)) if (v !== undefined) id.set(k, v);
    amp.identify(id);
  }
  Sentry.setUser({ id: userHashId });
};
```

### 5.3 이벤트 네이밍 규칙
- `snake_case` + 과거형(`viewed`, `started`, `completed`, `succeeded`, `failed`).
- 주체 + 대상 + 동작: `matching_session_started`, `intervention_invoked`.
- **PII 페이로드 금지**: 닉네임·이메일·전화 포함 불가.

## 6. 결제 이벤트 합성 (Sentry + Amplitude)

```ts
export const onPurchaseResult = (ok: boolean, meta: { productId: string; amount: number; code?: string }) => {
  if (ok) {
    track('purchase_succeeded', { productId: meta.productId, amount: meta.amount, currency: 'KRW' });
    Sentry.addBreadcrumb({ category: 'payment', level: 'info', data: meta });
  } else {
    track('purchase_failed', { productId: meta.productId, code: meta.code ?? 'UNKNOWN' });
    Sentry.captureMessage('purchase_failed', 'error');
  }
};
```

## 7. Web Vitals / RUM

- Sentry `browserTracingIntegration` 이 LCP/CLS/INP/TTFB 자동 수집.
- 추가로 `onINP`(web-vitals 라이브러리) 를 사용해 라우트별 커스텀 태깅.
- 주요 페이지는 **Amplitude 에도 성능 이벤트** 로 전송하지 않는다 — 단일 진실(Sentry) 유지.

## 8. CSP / 네트워크 정책

Content-Security-Policy 는 Sentry/Amplitude 엔드포인트를 **명시 허용**:
```
connect-src 'self' https://*.ingest.sentry.io https://api2.amplitude.com https://cdn.growthbook.io https://<api-origin>
img-src    'self' data: https://<cdn-origin>
script-src 'self' 'strict-dynamic' 'nonce-<N>'
report-uri https://<sentry-endpoint>/api/<project>/security/
```

- HSTS / Referrer-Policy / Permissions-Policy 함께 설정.
- CSP report 를 Sentry 의 CSP-Reports 로 수집 → 위반 모니터링.

## 9. 로그 수준 / 콘솔 정책

- `console.error` 는 Sentry 브레드크럼으로 자동 수집.
- 그 외 `console.log/info` 는 개발 환경에서만. 커밋 전 제거(lint-staged 에서 `no-console` 경고).

## 10. 샘플링/볼륨 제어

- 개발/staging: 100%.
- production: traces 10%, replay on-error 20%.
- 이벤트 드립(event drop) 모니터링 — quota 초과 시 Sentry `sample_rate` 를 동적 낮춤(설정은 ADR).

## 11. 릴리즈 표기

- `release: VITE_APP_VERSION = <shortSha>@<semver>`.
- 배포 스크립트:
  ```bash
  pnpm build
  pnpm exec sentry-cli releases new "$VITE_APP_VERSION"
  pnpm exec sentry-cli sourcemaps upload --release "$VITE_APP_VERSION" dist
  pnpm exec sentry-cli releases finalize "$VITE_APP_VERSION"
  ```

## 12. 안티패턴

- `Sentry.setUser({ email })` 또는 닉네임 저장.
- Amplitude 이벤트 이름을 컴포넌트에서 자유 서술(오타로 다른 이벤트 생성).
- 동일 사건을 Sentry + Amplitude + ELK 3곳에 중복 로깅.
- 배포 산출물에 `.map` 노출.
- Replay 마스킹 해제.
- URL 쿼리 마스킹 없이 민감 파라미터 그대로.
- production 에서 샘플링 100% 유지(비용/노이즈).

## 13. 체크리스트 (PR)

- [ ] 새 에러 경로에 경계(또는 `captureException`) 연결.
- [ ] 새 분석 이벤트는 `AnalyticsEvents` 스키마 등록.
- [ ] PII 필드 스크러빙 경로 확인.
- [ ] CSP allowlist 업데이트 여부.
- [ ] 샘플링 설정 변경 시 ADR.

## 14. References

- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Replay — privacy](https://docs.sentry.io/platforms/javascript/session-replay/privacy/)
- [Amplitude Browser SDK](https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-2)
- [web.dev — INP](https://web.dev/articles/inp)
- 내부: [error-suspense-boundary](../error-suspense-boundary/SKILL.md), [data-tanstack-axios-zod](../data-tanstack-axios-zod/SKILL.md), [feature-flags-growthbook](../feature-flags-growthbook/SKILL.md)
