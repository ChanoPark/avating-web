import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 접근성 E2E — 핵심 공개 라우트의 axe 위반 0(testing-stack 스킬 §8). disableRules 는 쓰지 않는다.
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

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const unexpected = results.violations.filter((v) => !KNOWN_VIOLATION_RULES.has(v.id));
    expect(unexpected).toEqual([]);
  });
}
