import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 설정 — avating-web
 *
 * 실행 대상: `vite build` 로 만든 **mock 모드 번들** 을 `vite preview` 로 서빙한다.
 * - `e2e:build` 스크립트가 `VITE_API_MODE=mock` + `VITE_API_BASE_URL=http://localhost:8080`
 *   을 인라인 주입 → 번들 부팅 시 MSW 워커(`src/shared/mocks/browser.ts`)가 자동 기동되고
 *   axios(`@shared/api/http`) 와 핸들러가 같은 BASE_URL 을 보므로 모든 요청이 가로채진다.
 * - 따라서 실 백엔드 없이 hermetic 하게 동작한다. (자세한 내용: .claude/notes/e2e-playwright.md)
 *
 * 매트릭스: chromium(Desktop Chrome) + webkit(iPhone 14) — CLAUDE.md 의 iOS Safari 호환 필수 정책.
 */

const PORT = 4173;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  // 단위/통합 테스트(*.test.*)는 Vitest 담당. Playwright 는 *.spec.ts 만 수집.
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  // .only 잔존 시 CI 실패 (가짜 통과 차단).
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // 로컬은 Playwright 기본 워커 수, CI 만 2 로 고정 (exactOptionalPropertyTypes 로 undefined 직접 대입 불가).
  ...(isCI ? { workers: 2 } : {}),
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['iPhone 14'] } },
  ],
  // 외부 E2E_BASE_URL 이 주어지면(예: 배포된 프리뷰 대상) 서버를 띄우지 않는다.
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: `pnpm run e2e:build && pnpm exec vite preview --port ${PORT} --strictPort`,
          url: BASE_URL,
          // 콜드 빌드+프리뷰는 60s 를 넘길 수 있어 여유를 둔다.
          timeout: 120_000,
          reuseExistingServer: !isCI,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      }),
});
