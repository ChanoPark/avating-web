---
name: mocking-msw
description: MSW v2 — dev/test 공용 모킹, 팩토리·핸들러 구성, 시나리오 토글, 배포 번들 제외, 스토리북 연동
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(모킹)
  - CLAUDE.md#개발-규칙(MSW)
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# MSW (Mock Service Worker) v2

## 1. 방침

- **dev/test 에서 MSW 는 필수 기본값**. 백엔드 부재/장애 시에도 화면 작업이 멈추지 않는다.
- **production 번들에서는 완전히 제외**. 번들에 섞이면 실서비스 네트워크가 Service Worker 로 가로채질 위험 → 차단 구조 필수.
- 응답 스키마는 **엔티티의 Zod 스키마와 동일한 타입** 을 반환 — 런타임 드리프트 방지.

## 2. Install

```bash
pnpm add -D msw@^2 @faker-js/faker @mswjs/data
pnpm msw init public/ --save
```

- `msw@2` 는 `http` / `graphql` / `ws` 네임스페이스 기반(이전 `rest.*` 는 deprecated).
- `@faker-js/faker` 로 리얼리스틱 목. `@mswjs/data` 는 관계형 레코드 필요 시.

## 3. 디렉터리 구조

```
src/shared/mocks/
├── browser.ts           # setupWorker (개발 브라우저)
├── server.ts            # setupServer (Vitest)
├── db.ts                # @mswjs/data 또는 in-memory 팩토리
├── factories/
│   ├── avatar.ts
│   ├── session.ts
│   └── diamond.ts
├── handlers/
│   ├── index.ts         # export const handlers = [...all]
│   ├── avatar.ts
│   ├── session.ts
│   └── auth.ts
└── scenarios/
    ├── index.ts         # key → handler[] 매핑
    ├── happy.ts
    ├── network-flaky.ts
    └── quota-exceeded.ts
```

## 4. 핸들러 — HTTP v2 스타일

```ts
// src/shared/mocks/handlers/avatar.ts
import { http, HttpResponse, delay } from 'msw';
import { env } from '@shared/config/env';
import { makeAvatar } from '../factories/avatar';

const base = env.VITE_API_BASE;

export const avatarHandlers = [
  http.get(`${base}/avatars/:id`, async ({ params }) => {
    await delay('real'); // 환경-유사 지연
    const id = String(params.id);
    return HttpResponse.json(makeAvatar({ id }));
  }),

  http.get(`${base}/avatars`, async ({ request }) => {
    const url = new URL(request.url);
    const persona = url.searchParams.get('persona') ?? undefined;
    const cursor  = url.searchParams.get('cursor')  ?? undefined;
    return HttpResponse.json({
      items: Array.from({ length: 10 }, () => makeAvatar({ persona })),
      nextCursor: cursor ? null : 'cursor-2',
    });
  }),

  http.post(`${base}/avatars`, async ({ request }) => {
    const body = (await request.json()) as { nickname?: string };
    if (!body.nickname) {
      return HttpResponse.json(
        { code: 'VALIDATION', message: 'nickname required', retryable: false },
        { status: 422 },
      );
    }
    return HttpResponse.json(makeAvatar({ nickname: body.nickname }), { status: 201 });
  }),
];
```

- **절대 경로 고정**: `VITE_API_BASE` 를 사용해 실제 서비스 URL 과 일치 → 네트워크 탭에서 진짜 API 처럼 보임.
- **에러 시나리오는 별도 scenario 로** (§7).

## 5. Factory — 리얼리스틱 데이터

```ts
// src/shared/mocks/factories/avatar.ts
import { faker } from '@faker-js/faker/locale/ko';
import type { Avatar } from '@entities/avatar/model';

export const makeAvatar = (overrides: Partial<Avatar> = {}): Avatar => ({
  id: overrides.id ?? crypto.randomUUID() as Avatar['id'],
  nickname: overrides.nickname ?? faker.internet.userName(),
  persona: overrides.persona ?? {
    mbti: faker.helpers.arrayElement(['ENFP','INFP','ENTP','INTJ']),
    tags: faker.helpers.arrayElements(['취준','대학생','재택','운동','독서','영화'], 3),
  },
  createdAt: overrides.createdAt ?? new Date(),
});
```

- 반환 타입은 실제 Zod 추론 타입과 동일 — 타입 드리프트 시 컴파일 실패.

## 6. 브라우저 worker — DEV 조건부 로드

```ts
// src/shared/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

```tsx
// src/app/main.tsx (발췌)
if (import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true') {
  const { worker } = await import('@shared/mocks/browser');
  await worker.start({
    onUnhandledRequest: (req, print) => {
      // 외부 CDN/분석 도구 등은 bypass
      const url = new URL(req.url);
      if (/(sentry|amplitude|growthbook)\./.test(url.host)) return;
      print.warning();
    },
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}
```

**규칙**:
- production 번들에 **import 자체를 포함하지 않는다**. dynamic import 뒤에 `DEV` 가드 필수.
- `mockServiceWorker.js` 는 `public/` 에만 존재. staging/prod 배포 시에도 정적 파일로 올라오지만 스크립트가 등록하지 않는 한 활성화되지 않는다.

## 7. 시나리오 — 테스트/QA 전환

```ts
// src/shared/mocks/scenarios/index.ts
import { handlers as happy } from './happy';
import { handlers as flaky } from './network-flaky';
import { handlers as quotaExceeded } from './quota-exceeded';

export const scenarios = { happy, flaky, quotaExceeded } as const;
export type ScenarioKey = keyof typeof scenarios;
```

```ts
// .env.development
VITE_MSW_SCENARIO=happy
```

브라우저에서 임의로 전환할 수 있는 devtool(개발자 패널) 을 `/dev-tools` 에 제공. Amplitude/Sentry 이벤트 오염 방지 위해 환경 체크.

## 8. Vitest 서버

```ts
// src/shared/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```

```ts
// vitest.setup.ts
import { server } from '@shared/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- `onUnhandledRequest: 'error'` — 테스트에서 미등록 요청은 곧바로 실패. 실수 감지.
- 테스트 내 override 는 **`server.use(...)`** 로만. `afterEach` 가 자동 리셋.

```ts
test('세션 재개 실패 복구', async () => {
  server.use(
    http.get(`${base}/sessions/:id`, () =>
      HttpResponse.json({ code: 'NETWORK', message: 'flaky', retryable: true }, { status: 503 }),
    ),
  );
  // ...
});
```

## 9. Storybook 연동

```bash
pnpm add -D msw-storybook-addon
```

- `preview.ts` 에서 `initialize({ onUnhandledRequest: 'bypass' })` 후 모든 데이터 의존 스토리에 파라미터로 핸들러 주입.
- 각 스토리에 성공/빈 상태/에러 variant 최소 3개.

## 10. Playwright (E2E) 연동

- 기본적으로 **실 서버 또는 스테이징 API** 와 테스트. MSW 로 가로막는 구조는 E2E 의 본래 취지에 반.
- 예외: **완전 오프라인 데모** 페이지 → Playwright 실행 전 `VITE_USE_MOCK=true` 로 실행.

## 11. 인증/세션 쿠키

- `credentials: 'include'` 가 설정된 요청은 MSW 가 쿠키를 그대로 반영.
- 로그인 플로우를 테스트하려면 `set-cookie` 를 `HttpResponse.json(..., { headers: { 'Set-Cookie': '...' } })` 로 모의.

## 12. 보안/운영 체크리스트

- [ ] `mockServiceWorker.js` 외 MSW 코드가 `dist/assets/*.js` 에 섞이지 않는지 번들 분석 확인.
- [ ] production 번들에 `import 'msw/browser'` 문자열이 존재하지 않음(`grep` CI 스텝).
- [ ] staging 에서는 MSW off (실 백엔드 연동).
- [ ] devtool 패널은 `env.VITE_APP_ENV === 'development'` 일 때만 노출.

## 13. 안티패턴

- 핸들러 내부에서 랜덤 지연을 너무 크게 설정 → 테스트 타임아웃.
- 모킹 데이터를 컴포넌트 파일에 하드코딩.
- 프로덕션 번들에 MSW 포함.
- `server.use()` 이후 `resetHandlers()` 누락.
- 전역 외부 도메인(Sentry, Amplitude 등)을 MSW 가 가로챔 — bypass 명시.
- 한 파일에 수십 개 핸들러 — 도메인별 분리.

## 14. References

- [MSW docs](https://mswjs.io/docs)
- [MSW v2 migration](https://mswjs.io/docs/migrations/1.x-to-2.x/)
- [@mswjs/data](https://github.com/mswjs/data)
- [msw-storybook-addon](https://storybook.js.org/addons/msw-storybook-addon)
- 내부: [data-tanstack-axios-zod](../data-tanstack-axios-zod/SKILL.md), [testing-stack](../testing-stack/SKILL.md), [storybook-a11y](../storybook-a11y/SKILL.md)
