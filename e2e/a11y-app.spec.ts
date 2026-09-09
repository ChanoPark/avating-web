import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 인증 게이트 라우트의 접근성 — 공개 라우트만 보던 `a11y.spec.ts` 의 사각지대를 메운다.
 *
 * 2026-09-09 Codex 이식에서 이 사각지대에 실제로 두 건이 숨어 있었다: 통계 카드 라벨이
 * `--text-muted`(3.94:1)로 내려갔고, identity 타일이 `--id-none` 위에 흰 글자(3.94:1)를 얹었다.
 * 단위 테스트도 공개 라우트 axe 도 둘 다 통과하는 종류라 게이트 라우트를 직접 열어야 잡힌다.
 *
 * mock 번들은 storageState 로 토큰을 복원할 계약이 없어 로그인 UI 를 그대로 거친다
 * (.claude/notes/e2e-playwright.md "인증 게이트 라우트").
 */
const GATED_ROUTES = ['/dashboard', '/avatars/avatar-1'] as const;

async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.fill('#login-email', 'coach@avating.app');
  await page.fill('#login-password', 'Avating1234!');
  await page
    .getByRole('button', { name: /로그인/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
}

for (const route of GATED_ROUTES) {
  test(`a11y 위반 0 — ${route} (로그인 후)`, async ({ page }) => {
    await signIn(page);
    await page.goto(route);
    await expect(page.locator('#root')).not.toBeEmpty();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('a11y 위반 0 — 매칭 요청 모달이 열린 상태', async ({ page }) => {
  await signIn(page);
  await page.goto('/avatars/avatar-1');
  await page.getByRole('button', { name: '매칭 요청 보내기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
