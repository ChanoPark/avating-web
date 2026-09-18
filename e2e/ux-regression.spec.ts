import { test, expect } from '@playwright/test';

/**
 * UX 회귀 — jsdom 이 못 보는 것들만 여기서 막는다.
 *
 * 2026-09-18 Playwright 감사에서 실측으로 잡힌 네 가지가 대상이다.
 * 전부 "테스트는 그린인데 화면은 어색한" 종류라, 수치를 단언으로 박아 둔다.
 *  1) 스켈레톤 높이 ≠ 실제 콘텐츠 높이 → 로드가 끝나는 순간 화면이 튄다 (stat +32px · 알림 +28.5px)
 *  2) 모달이 애니메이션 없이 튀어나왔다 (정본 `.cx-dialog` = cx-rise · --dur-slow · --ease-out)
 *  3) 마우스로 모달을 열기만 해도 첫 아바타 행에 파란 포커스 링이 떴다 (focus-within 오용)
 *  4) 상단바 아이콘 버튼이 17×17 · 20×20 이라 터치 타깃이 없었다
 */

const CREDENTIALS = { email: 'coach@avating.app', password: 'Avating1234!' };

async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.fill('#login-email', CREDENTIALS.email);
  await page.fill('#login-password', CREDENTIALS.password);
  await page
    .getByRole('button', { name: /로그인/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
}

test('스켈레톤과 실제 콘텐츠의 높이가 같다 — 로드 완료 시 화면이 튀지 않는다', async ({ page }) => {
  await signIn(page);

  // MSW 서비스워커가 핸들러에서 바로 응답하므로 Playwright 의 page.route 로는 못 늦춘다.
  // axios 가 쓰는 XHR 을 페이지 안에서 감싸 두 엔드포인트만 늦춘다 — 프로덕션 코드는 건드리지 않는다.
  await page.addInitScript(() => {
    const send = XMLHttpRequest.prototype.send;
    const open = XMLHttpRequest.prototype.open;
    const slow = /\/api\/(dashboard\/stats|inbox)/;
    XMLHttpRequest.prototype.open = function patchedOpen(this: XMLHttpRequest, ...args: unknown[]) {
      (this as unknown as { __url?: string }).__url = String(args[1] ?? '');
      return (open as (...a: unknown[]) => void).apply(this, args);
    } as typeof XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.send = function patchedSend(this: XMLHttpRequest, ...args: unknown[]) {
      const url = (this as unknown as { __url?: string }).__url ?? '';
      if (slow.test(url)) {
        setTimeout(() => (send as (...a: unknown[]) => void).apply(this, args), 2000);
        return;
      }
      return (send as (...a: unknown[]) => void).apply(this, args);
    } as typeof XMLHttpRequest.prototype.send;
  });

  const measure = () =>
    page.evaluate(() => {
      const stat = document.querySelector('.grid [class*="rounded-card"]');
      const inbox = [...document.querySelectorAll('section')].find(
        (s) => s.getAttribute('aria-label') === '알림'
      );
      return {
        stat: stat ? Math.round(stat.getBoundingClientRect().height) : -1,
        inbox: inbox ? Math.round(inbox.getBoundingClientRect().height) : -1,
      };
    });

  await page.goto('/dashboard');
  await expect(page.locator('.animate-pulse').first()).toBeVisible();
  const skeleton = await measure();

  await expect(page.getByText('총 매칭 횟수')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  const content = await measure();

  expect(skeleton.stat).toBeGreaterThan(0);
  expect(skeleton.inbox).toBeGreaterThan(0);
  expect(content.stat).toBe(skeleton.stat);
  expect(content.inbox).toBe(skeleton.inbox);
});

test('모달은 정본 cx-rise 로 진입한다 — opacity 가 0 에서 시작해 1 로 간다', async ({ page }) => {
  await signIn(page);
  await page.goto('/avatars/avatar-1');
  await expect(page.getByRole('button', { name: '매칭 요청 보내기' })).toBeVisible();

  const track = page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const samples: number[] = [];
        const t0 = performance.now();
        const tick = () => {
          const el = document.querySelector('[role="dialog"]');
          if (el) samples.push(Number(getComputedStyle(el).opacity));
          if (performance.now() - t0 < 500) requestAnimationFrame(tick);
          else resolve(samples);
        };
        requestAnimationFrame(tick);
      })
  );
  await page.getByRole('button', { name: '매칭 요청 보내기' }).click();
  const opacities = await track;

  expect(opacities.length).toBeGreaterThan(3);
  // 무애니메이션이면 첫 프레임부터 1 이다.
  expect(Math.min(...opacities)).toBeLessThan(0.9);
  expect(Math.max(...opacities)).toBe(1);
});

test('마우스로 모달을 열면 포커스 링이 뜨지 않고, 키보드로 옮기면 뜬다', async ({ page }) => {
  await signIn(page);
  await page.goto('/avatars/avatar-1');
  await page.getByRole('button', { name: '매칭 요청 보내기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1');

  const ringed = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll('label')].filter(
          (l) => getComputedStyle(l).boxShadow !== 'none'
        ).length
    );

  // 포커스 트랩이 첫 라디오로 포커스를 옮기지만, 키보드 포커스가 아니므로 링은 없어야 한다.
  expect(await ringed()).toBe(0);

  // 키보드로 옮기면 포커스 표시가 살아 있어야 한다 — 링을 통째로 죽인 게 아님을 못박는다.
  // webkit 은 Tab 으로 라디오를 건너뛰므로 label 의 링이 아니라 문서의 :focus-visible 을 본다.
  await page.keyboard.press('Tab');
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (document.querySelector(':focus-visible') === null ? 0 : 1) +
          [...document.querySelectorAll('label')].filter(
            (l) => getComputedStyle(l).boxShadow !== 'none'
          ).length
      )
    )
    .toBeGreaterThan(0);
});

test('상단바 아이콘 버튼은 터치 타깃 44px 를 채운다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto('/dashboard');

  for (const label of ['메뉴 열기', '알림']) {
    const box = await page.getByRole('button', { name: label }).boundingBox();
    expect(box, `${label} 버튼이 없다`).not.toBeNull();
    expect(Math.round(box?.width ?? 0), `${label} 폭`).toBeGreaterThanOrEqual(44);
    expect(Math.round(box?.height ?? 0), `${label} 높이`).toBeGreaterThanOrEqual(44);
  }
});

/**
 * 5) 비활성 아바타 행이 활성 행과 똑같이 보였다.
 *
 * `opacity-50` 을 정본대로 색 토큰(`text-disabled`)으로 바꾸면서 `<label>` 한 곳에만 걸었는데,
 * 이름·성향·라디오 마크가 전부 자기 색 클래스를 들고 있어 상속이 끊겼다. `cn` 은 tailwind-merge
 * 가 아니라 단순 join 이라 나중에 적어도 이기지 않는다 — 잎마다 직접 내려야 한다.
 * 실측: 비활성 행 이름 rgb(28,34,43) = 활성 행과 완전 동일, 커서 말고는 구분할 단서가 없었다.
 */
test('비활성 아바타 행은 이름까지 흐려진다 — 활성 행과 색이 달라야 한다', async ({ page }) => {
  await signIn(page);
  await page.goto('/avatars/avatar-1');
  await page.getByRole('button', { name: '매칭 요청 보내기' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveCSS('opacity', '1');

  const colors = await dialog.locator('label').evaluateAll((labels) =>
    labels.map((label) => {
      const input = label.querySelector('input[type="radio"]');
      const name = label.querySelector('span.truncate');
      return {
        disabled: input instanceof HTMLInputElement && input.disabled,
        nameColor: name === null ? null : getComputedStyle(name).color,
      };
    })
  );

  const enabled = colors.filter((c) => !c.disabled);
  const disabled = colors.filter((c) => c.disabled);
  expect(enabled.length).toBeGreaterThan(0);
  expect(disabled.length).toBeGreaterThan(0);

  const enabledColor = enabled[0]?.nameColor;
  for (const row of disabled) {
    expect(row.nameColor).not.toBe(enabledColor);
  }
});
