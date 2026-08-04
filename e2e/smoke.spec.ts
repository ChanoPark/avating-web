import { test, expect } from '@playwright/test';

/**
 * 공개 라우트 스모크 — 인증 없이 도달 가능한 경로만 검증한다.
 *
 * 인증 게이트 라우트(/dashboard, /avatars/:id, /onboarding/*)는 useAuthStore 가
 * 메모리 전용(persist 미사용)이라 storageState 로 복원되지 않는다 →
 * 해당 플로우 E2E 는 테스트 내에서 로그인 UI 를 거쳐야 한다.
 * (.claude/notes/e2e-playwright.md "인증 게이트 라우트" 참조)
 */
test.describe('공개 라우트 스모크', () => {
  test('서비스 소개(/) 렌더 후 로그인 진입', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page.getByText('Avating').first()).toBeVisible();

    await page.getByRole('button', { name: '로그인' }).first().click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('로그인(/login) 페이지가 폼 헤딩과 함께 렌더된다', async ({ page }) => {
    await page.goto('/login');
    // 와이어프레임 v2 `ScreenSignin` 의 확정 카피.
    await expect(page.getByRole('heading', { name: '다시 만나서 반가워요' })).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
  });

  test('알 수 없는 경로는 404 not-found 로 떨어진다', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { name: '찾을 수 없는 페이지예요' })).toBeVisible();
    // not-found 는 "메인 화면으로" 단독, server-error 는 "다시 시도" + "문의하기".
    await expect(page.getByRole('button', { name: '메인 화면으로' })).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toHaveCount(0);
  });
});
