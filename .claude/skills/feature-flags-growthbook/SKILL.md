---
name: feature-flags-growthbook
description: GrowthBook(Cloud) — 플래그/실험 중앙화, 타입 안전 훅, kill-switch, 플래시 방지, Amplitude 연동
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(피처-플래그)
scope: avating-web
authority: MUST
maintainer: platform
---

# GrowthBook Feature Flags & Experiments

## 1. 방침

- **모든 피처 토글은 GrowthBook 을 통해서만**. 코드 분기 속 if-else 남발 금지.
- 현재 **Cloud 사용**. 이후 self-host 전환이 예정되어 있으니 **단일 추상화 레이어** 를 두고 교체 지점 최소화.
- **결제/인증/실험군 결정 경로에 kill-switch 필수** — 장애/룰 위반 시 즉시 전체 차단 가능해야 함.
- Amplitude 와 연동해 **실험 노출(Exposure) 이벤트** 를 정확히 기록.

## 2. Install

```bash
pnpm add @growthbook/growthbook-react
```

## 3. 초기화

```ts
// src/app/observability/growthbook.ts
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react';
import * as amp from '@amplitude/analytics-browser';
import * as Sentry from '@sentry/react';
import { env } from '@shared/config/env';

export const gb = new GrowthBook({
  apiHost: 'https://cdn.growthbook.io',
  clientKey: env.VITE_GROWTHBOOK_CLIENT_KEY,
  enableDevMode: env.VITE_APP_ENV !== 'production',
  subscribeToChanges: true,
  trackingCallback: (experiment, result) => {
    amp.track('experiment_viewed', {
      experimentId: experiment.key,
      variationId: String(result.variationId),
    });
    Sentry.addBreadcrumb({
      category: 'experiment',
      level: 'info',
      data: { key: experiment.key, variation: result.variationId },
    });
  },
  onFeatureUsage: (featureKey, result) => {
    if (import.meta.env.DEV) {
      console.debug('[flag]', featureKey, result.value);
    }
  },
});

export const initGrowthBook = async () => {
  try {
    await gb.init({ streaming: true, timeout: 2_000 });
  } catch (err) {
    Sentry.captureException(err, { tags: { scope: 'growthbook-init' } });
  }
};
```

- `streaming: true` — SSE 로 실시간 업데이트.
- 초기화 실패해도 **앱은 계속 부팅** — 기본값(defaultValue) 으로 안전하게 동작.

## 4. Provider

```tsx
// src/app/providers/GrowthBookRoot.tsx
import { GrowthBookProvider } from '@growthbook/growthbook-react';
import { gb } from '@app/observability/growthbook';

export const GrowthBookRoot = ({ children }: { children: React.ReactNode }) => (
  <GrowthBookProvider growthbook={gb}>{children}</GrowthBookProvider>
);
```

## 5. 플래그 키 중앙화 (타입 안전)

```ts
// src/entities/flags/keys.ts
import { z } from 'zod';

export const FlagSchema = {
  'matching-drama-injection':   z.boolean(),
  'onboarding-headline':        z.enum(['default','A','B']),
  'payment-enabled':            z.boolean(),                 // kill-switch
  'intervention-min-diamonds':  z.number().int().min(0),
} as const;

export type FlagKey = keyof typeof FlagSchema;
export type FlagValue<K extends FlagKey> = z.infer<(typeof FlagSchema)[K]>;
export const DEFAULTS: { [K in FlagKey]: FlagValue<K> } = {
  'matching-drama-injection': false,
  'onboarding-headline': 'default',
  'payment-enabled': true,
  'intervention-min-diamonds': 1,
};
```

## 6. 타입 안전 훅

```ts
// src/shared/hooks/useFlag.ts
import { useFeatureValue, useFeatureIsOn } from '@growthbook/growthbook-react';
import { FlagSchema, DEFAULTS, type FlagKey, type FlagValue } from '@entities/flags/keys';

export function useFlag<K extends FlagKey>(key: K): FlagValue<K> {
  const raw = useFeatureValue(key, DEFAULTS[key] as never);
  const parsed = FlagSchema[key].safeParse(raw);
  return (parsed.success ? parsed.data : DEFAULTS[key]) as FlagValue<K>;
}

export function useFlagOn<K extends FlagKey>(key: K): boolean {
  return useFeatureIsOn(key);
}
```

사용:
```tsx
const paymentEnabled = useFlag('payment-enabled');
const minDiamonds   = useFlag('intervention-min-diamonds');
const headline      = useFlag('onboarding-headline'); // 'default'|'A'|'B'
```

## 7. 사용자 어트리뷰트 (PII 금지)

```ts
gb.setAttributes({
  id: userHashId,                   // 내부 해시 ID — 이메일/전화 금지
  country: 'KR',
  device: isMobile ? 'mobile' : 'desktop',
  appVersion: env.VITE_APP_VERSION,
  env: env.VITE_APP_ENV,
});
```

로그인/로그아웃 시 어트리뷰트를 갱신해 실험 분기 신뢰성 확보.

## 8. Flash 방지 (SPA Loading UX)

- SPA 는 첫 JS 로드 후 플래그가 hydrate 됨 → 변형 전에 default 렌더 → 잠깐 깜빡임.
- 해결:
  1. 첫 화면의 **실험 영역만 스켈레톤** 으로 감싸고 `gb.ready` 이후 실제 변형 렌더.
  2. 실험 범위를 최초 노출 이후 지점으로 이동(온보딩 2단계 이후 등).

```tsx
const ready = gb.ready;
if (!ready) return <HeroSkeleton />;
return <Hero variant={headline} />;
```

## 9. 실험(Experiments)

- **사전 등록**: GrowthBook UI 에 실험 메타(목표 지표, 가설, 제거 기한, 오너) 작성.
- **최소 표본**: Amplitude 의 rate metric 기반으로 산정(별도 가이드).
- **실험 노출 이벤트**: `trackingCallback` 에서 `experiment_viewed` 발행 → Amplitude 분석.
- **결과 반영**: 통계 유의성 확보 시 variant 를 100% 롤아웃 → 코드에서 분기 제거(→ §11).

## 10. 결제·인증 경로의 Kill-switch

- `payment-enabled` 플래그가 false 이면 결제 라우트 진입 시 **유지보수 안내 페이지** 로 폴백.
- 토큰 재발급 경로에 `auth-refresh-enabled` 와 같은 플래그를 둘 필요는 없음 — 핵심 인증 플로우는 플래그로 가리지 않는다(배포/롤백이 기본).

## 11. 플래그 수명 관리

- GrowthBook UI 에 **제거 기한(end-of-life)** 메타 입력 필수. 기한 경과 시 정리 PR 자동 생성(봇).
- 코드 내 플래그 참조가 남아있으면 삭제 금지 — `knip` / `grep` 로 사용처 확인 후 제거.
- 실험 승격:
  1. variant 승자 결정 → 2. 기본값을 승자로 교체 → 3. 코드에서 분기 제거 → 4. 플래그 아카이브.

## 12. SSR/SPA 정합

- 본 프로젝트는 SPA. SSR 은 없음 → `initSync` 대신 `init` + `streaming` 으로 충분.
- Edge 배포(CloudFront)에 의해 HTML 은 캐시되지만 JS 가 로드되어 플래그 평가가 완료된다.

## 13. 테스트

- 단위: `useFlag` 를 **MSW/모의 GB 인스턴스** 로 주입. 테스트 전용 Provider 에서 `gb.setForcedFeatures(new Map(...))`.
- E2E: Playwright 에서 `window.__E2E_FORCE_FLAGS__` 전역을 이용해 특정 변형 고정(개발/스테이징 한정).

```ts
// dev only
if (env.VITE_APP_ENV !== 'production' && (window as any).__E2E_FORCE_FLAGS__) {
  const forced = new Map(Object.entries((window as any).__E2E_FORCE_FLAGS__));
  gb.setForcedFeatures(forced);
}
```

## 14. 관측 / 경보

- Amplitude 대시보드: 실험별 **전환율(매칭→본캐 연결)**, **ARPU**, **재방문율** 패널.
- Sentry: 실험 노출 breadcrumb → 오류 발생 시 실험 컨텍스트 확인.
- GrowthBook Slack 알림: SRM(Sample Ratio Mismatch), 급락 지표, 실험 종료 임박.

## 15. 안티패턴

- 플래그 키 하드코딩(`'onboarding-headline'`)을 여러 파일에 분산 — 반드시 `FlagSchema`.
- 서버 시크릿(결제 키, API 비밀값)을 플래그로 전달 — **클라이언트 플래그는 공개 값만**.
- 실험 제거 기한 미설정, 만료 플래그 방치.
- A/B 변형에 서로 다른 분석 이벤트 이름을 부여해 비교 불가.
- `useFeatureValue` 를 조건부 호출(React Hook 규칙 위반).
- PII 어트리뷰트(`email`, `nickname`) 전송.

## 16. 체크리스트 (플래그 신설 PR)

- [ ] `FlagSchema` 에 키와 스키마 추가.
- [ ] `DEFAULTS` 에 안전 기본값.
- [ ] GrowthBook UI 에 메타(소유자/기한/가설) 등록.
- [ ] kill-switch 가 필요한 경로인지 판단.
- [ ] 코드에서 `useFlag` 로만 접근(직접 `useFeatureValue` 금지).
- [ ] 실험이면 Amplitude 대시보드에 지표 패널 준비.
- [ ] 테스트: 각 분기 시나리오.

## 17. References

- [GrowthBook React SDK](https://docs.growthbook.io/lib/react)
- [GrowthBook — Experimentation 101](https://docs.growthbook.io/experimentation-analysis/experimentation-101)
- [Amplitude Experiment](https://amplitude.com/docs/experiment)
- 내부: [observability-sentry-amplitude](../observability-sentry-amplitude/SKILL.md), [typescript-strict](../typescript-strict/SKILL.md)
