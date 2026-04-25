---
name: testing-stack
description: Vitest + Testing Library + Playwright + @axe-core/playwright + Lighthouse CI — TDD, 80% 커버리지, iOS Safari 매트릭스, a11y/성능 예산
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(테스트)
  - CLAUDE.md#품질-기준
  - CLAUDE.md#개발-규칙(TDD)
scope: avating-web
authority: MUST
maintainer: qa
---

# Testing Stack — Vitest / RTL / Playwright / axe / LHCI

## 1. 계층 & 역할

```
[Unit]           Vitest + RTL            함수/훅/컴포넌트 — 80%+ 커버리지
[Integration]    Vitest + MSW            API 경계 + TanStack Query + Zod
[Contract]       Zod 스키마 테스트        백엔드 스펙 드리프트 탐지
[E2E]            Playwright              chromium + webkit 매트릭스
[Accessibility]  @axe-core/playwright    페이지 단위 위반 0
[Performance]    Lighthouse CI           LCP<2.5s / CLS<0.1 / INP<200ms
[Visual]         Storybook + Chromatic   (선택) 리그레션
```

## 2. Install

```bash
# Unit / Integration
pnpm add -D vitest@^2 @vitest/coverage-v8 @vitest/ui jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event

# E2E + A11y
pnpm add -D @playwright/test @axe-core/playwright

# Performance budget
pnpm add -D @lhci/cli
```

`pnpm exec playwright install --with-deps chromium webkit` 로 브라우저 설치.

## 3. Vitest 설정

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['src/**/*.stories.{ts,tsx}', 'node_modules'],
      restoreMocks: true,
      mockReset: true,
      unstubEnvs: true,
      pool: 'forks',
      poolOptions: { forks: { singleFork: false } },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.stories.{ts,tsx}',
          'src/**/*.d.ts',
          'src/shared/mocks/**',
          'src/app/main.tsx',
        ],
        thresholds: {
          lines: 80, statements: 80, functions: 80, branches: 75,
          perFile: false,
        },
      },
      reporters: [process.env.CI ? ['default', { summary: false }] : 'default'],
    },
  }),
);
```

### setup 파일
```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '@shared/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());
```

## 4. RTL — 권장 사용법

### 4.1 쿼리 우선순위
1. `getByRole` / `findByRole` / `queryByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. (최후) `getByTestId` — `data-testid` 는 UI 에 노출되지 않아 안전한 마지막 수단.

### 4.2 비동기
```ts
await screen.findByRole('heading', { name: /매칭/ });
await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
```

### 4.3 사용자 상호작용
- `userEvent` 만 사용 (`fireEvent` 금지).
- 모든 테스트 시작 시 `const user = userEvent.setup()` 로 세션 공유.

### 4.4 공통 테스트 유틸
```ts
// src/test/renderWithProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

export const renderWithProviders = (ui: React.ReactElement, opts?: { route?: string }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[opts?.route ?? '/']}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};
```

## 5. 통합 테스트 — TanStack Query + MSW

```ts
test('아바타 상세 — 정상 조회', async () => {
  renderWithProviders(<Avatar id={'abc' as AvatarId} />);
  expect(await screen.findByRole('heading', { name: /홍길동/ })).toBeInTheDocument();
});

test('아바타 상세 — 503 에러 복구', async () => {
  server.use(
    http.get(`${base}/avatars/:id`, () => HttpResponse.json({ code: 'NETWORK' }, { status: 503 })),
  );
  renderWithProviders(<Avatar id={'abc' as AvatarId} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/연결이 불안정/);
  await userEvent.click(screen.getByRole('button', { name: /다시 시도/ }));
});
```

## 6. 계약(Contract) 테스트

- `entities/*/model.ts` 의 Zod 스키마에 대한 **샘플 응답 파싱 테스트** 를 작성. OpenAPI 샘플을 `src/entities/*/__fixtures__/*.json` 에 두고 로드.
- 백엔드 스펙 변경 시 빨리 fail.

```ts
import avatarSample from './__fixtures__/avatar.sample.json';
test('Avatar 스키마 파싱', () => { expect(Avatar.parse(avatarSample)).toBeDefined(); });
```

## 7. Playwright — chromium + webkit

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit',   use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'pnpm preview --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

### 중요 플로우 (최소)
- 온보딩: Custom GPT 연결 코드 입력 → 페르소나 생성 → 아바타 생성.
- 매칭: 상대 아바타 선택 → 세션 진입 → 메시지 확인.
- 훈수: 다이아 소모 → 프롬프트 주입 → 아바타 대사 변경.
- 본캐 연결: 호감도 임계 도달 → 양측 동의 + 티켓 사용.

### storageState 재사용
```ts
// e2e/global-setup.ts
await loginAs(page, 'testuser');
await page.context().storageState({ path: 'e2e/.auth/user.json' });
```

## 8. 접근성 E2E (axe)

```ts
import AxeBuilder from '@axe-core/playwright';

test('랜딩 a11y 위반 0', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

- 각 핵심 라우트(/ /onboarding /matching /my /login)에 대해 1개씩 작성.
- `disableRules` 는 ADR 동반 없이는 금지.

## 9. Lighthouse CI — 성능 예산

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173/", "http://localhost:5173/onboarding"],
      "numberOfRuns": 3,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift":  ["error", { "maxNumericValue": 0.1 }],
        "interaction-to-next-paint": ["error", { "maxNumericValue": 200 }],
        "total-blocking-time":       ["warn",  { "maxNumericValue": 200 }],
        "unused-javascript":         ["warn",  { "maxLength": 1 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

## 10. TDD 프로토콜 (CLAUDE.md 강제)

1. **Zod 스키마 작성** (도메인 진실).
2. **테스트 작성** (실패하는 RED). 가능한 경우 `it.todo(...)` 로 먼저 시나리오 목록화.
3. **구현** (GREEN, 최소 변경).
4. **리팩터**.
5. **커버리지 확인** (`pnpm test:cov`).

### 커버리지 하위 기준
- **라인/함수/구문 80% / 브랜치 75%** — 낮추지 않는다.
- 커버리지 달성 목적의 “가짜 테스트” 금지. 유의미한 단언 없는 테스트는 PR 에서 반려.

## 11. 모킹 정책

- HTTP: MSW 만 사용.
- 시간: `vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })`.
- 랜덤: `vi.spyOn(crypto, 'randomUUID').mockReturnValue('...')`.
- 클립보드/지오: Vitest 환경 + jsdom 확장.

## 12. 플레이크(flaky) 관리

- 재시도는 **CI 한정 2회**. 로컬은 0.
- flaky 로 분류된 테스트는 `test.fixme` + 이슈 링크. 7일 내 수정 없으면 제거.
- 타임 종속 테스트는 `waitFor` + 명확한 선행 조건.

## 13. 실행 스크립트

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:cov": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "lhci": "lhci autorun"
  }
}
```

## 14. 안티패턴

- `getByTestId` 남발 → 사용자 관점 쿼리로 전환.
- `act()` 수동 래핑.
- 구현 세부(클래스명/내부 상태)를 단언.
- 비동기 테스트에서 `waitFor` 없이 `setTimeout`.
- 모든 테스트에서 전역 Provider 를 수동 재설정 — `renderWithProviders` 사용.
- Playwright 로 순수 유닛 테스트를 대체.
- 접근성 위반을 ignore/disable 로 숨김.

## 15. PR 머지 조건

- [ ] 변경 영역에 유닛/통합 테스트 추가(또는 기존 보강).
- [ ] `pnpm test:cov` 80% 이상.
- [ ] 변경이 주요 플로우에 영향 시 Playwright 업데이트.
- [ ] 신규 페이지 추가 시 axe 테스트 1개.
- [ ] Lighthouse CI 예산 통과.

## 16. References

- [Vitest docs](https://vitest.dev/)
- [Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles)
- [Playwright docs](https://playwright.dev/)
- [axe DevTools — rules](https://dequeuniversity.com/rules/axe/)
- [Web Vitals — Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- 내부: [mocking-msw](../mocking-msw/SKILL.md), [data-tanstack-axios-zod](../data-tanstack-axios-zod/SKILL.md)
