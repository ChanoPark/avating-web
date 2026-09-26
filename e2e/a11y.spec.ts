import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 접근성 E2E — 핵심 공개 라우트의 axe 위반 0. disableRules 는 쓰지 않는다.
 *
 * 이 spec 은 덮는 화면의 회귀를 막는 장치다. ARIA 를 먼저 챙겨 넣지는 않지만(a11y MVP 정책),
 * 여기서 새 위반이 나면 고치거나, 다듬기 수준이면 KNOWN_VIOLATION_RULES 에 사유를 남긴다.
 *
 * 2026-09-09 Codex 토큰 교체로 / 와 /login 의 color-contrast 위반 3건이 해소돼
 * KNOWN_VIOLATION_RULES 를 비우고 엄격 검사를 복원했다. 새 위반을 한시적으로 허용하려면
 * 사유와 해소 계획을 주석으로 함께 남긴다.
 * 상세: .claude/notes/e2e-playwright.md "알려진 a11y 발견사항".
 */
const ROUTES = ['/', '/login'] as const;

const KNOWN_VIOLATION_RULES = new Set<string>();

for (const route of ROUTES) {
  test(`a11y 위반 0 — ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('#root')).not.toBeEmpty();
    // PageTransition(--dur-base 150ms) 정착 전에 재면 반투명 합성색으로 대비가 잘못 계산된다.
    await expect(page.locator('#root > div').first()).toHaveCSS('opacity', '1');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const unexpected = results.violations.filter((v) => !KNOWN_VIOLATION_RULES.has(v.id));
    expect(unexpected).toEqual([]);
  });
}
