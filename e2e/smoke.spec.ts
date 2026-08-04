import { test, expect } from '@playwright/test';

/**
 * 공개 라우트 스모크 — 인증 없이 도달 가능한 경로만 검증한다.
 *
 * 인증 게이트 라우트(/dashboard, /avatars/:id, /onboarding/*)는 useAuthStore 가
 * localStorage 로 persist 되므로 storageState 로 복원할 수 있다 (키: `avating-auth`).
 * 다만 저장값은 실제 서버가 발급한 토큰이어야 하고 mock 번들에는 그 계약이 없어,
 * 지금은 여전히 테스트 내에서 로그인 UI 를 거치는 쪽이 안전하다.
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
    await expect(page.getByRole('heading', { name: '일시적인 문제가 발생했어요' })).toBeVisible();
    // 제목은 server-error 와 공유하므로 CTA 조합으로 variant 를 구별한다.
    // not-found 는 "메인 화면으로" 단독, server-error 는 "다시 시도" + "문의하기".
    await expect(page.getByRole('button', { name: '메인 화면으로' })).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toHaveCount(0);
  });
});
