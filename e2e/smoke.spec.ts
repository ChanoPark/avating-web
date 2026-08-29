import { test, expect } from '@playwright/test';

/**
 * 공개 라우트만 검증한다 — 인증 게이트 라우트(/dashboard, /avatars/:id, /onboarding/*)는
 * useAuthStore 가 localStorage 에 저장한 토큰으로 storageState 복원이 가능해 보이지만,
 * mock 번들은 실제 서버가 발급하는 토큰 계약이 없어 지금은 로그인 UI 를 직접 거치는 쪽이
 * 안전하다(.claude/notes/e2e-playwright.md "인증 게이트 라우트" 참조).
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
    await expect(page.getByRole('heading', { name: '찾는 페이지가 없어요.' })).toBeVisible();
    // 비로그인 404 는 S-11-03 플랫 레이아웃(서비스 소개로·로그인)이다 — 셸을 유지하는 로그인
    // 상태 404 와 다르다.
    await expect(page.getByRole('button', { name: '서비스 소개로' })).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
    // 재시도는 서버 에러(S-11-04) 전용이다. 없는 주소는 다시 시도해도 없다.
    await expect(page.getByRole('button', { name: '다시 시도' })).toHaveCount(0);
  });
});
