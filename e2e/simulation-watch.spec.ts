import { test, expect } from '@playwright/test';

/**
 * 시뮬레이션 관전 — 사이드바 "시뮬레이션" 의 세션 목록에서 들어가 대화를 보는 흐름.
 *
 * jsdom 이 못 보는 두 가지를 여기서 막는다.
 *  1) 관전 화면만 셸 여백 없이 본문을 꽉 채운다(`data-shell-flush` + `:has()`). 높이 사슬이 끊기면
 *     종료 바가 대화 바로 밑에 붙거나 화면 밖으로 밀린다.
 *  2) 진행 중인 세션은 MSW 서비스워커가 흘려 주는 text/event-stream 을 fetch 로 읽는다. 브라우저가
 *     스트림을 끝까지 전달하지 못하면 대화가 영영 끝나지 않는다.
 */

const CREDENTIALS = { email: 'coach@avating.app', password: 'Avating1234!' };
const ENDED_SESSION = 'dddddddd-0004-4000-8000-000000000004';
const RUNNING_SESSION = 'dddddddd-0001-4000-8000-000000000001';

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

test('시뮬레이션 목록의 끝난 세션에서 "결과 보기" 로 들어가면 대화 기록과 종료 안내가 보인다', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/sim');
  await expect(page.getByRole('heading', { level: 1, name: '시뮬레이션' })).toBeVisible();

  await page.getByRole('button', { name: '하늘 시뮬레이션 결과 보기', exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/sim/${ENDED_SESSION}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('hyunwoo');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('하늘');
  const log = page.getByRole('log', { name: '대화 기록' });
  await expect(log.getByRole('article')).toHaveCount(8);
  await expect(log.getByText(/TURN/)).toHaveCount(0);
  await expect(log.locator('time').first()).toBeVisible();
  await expect(page.getByText('이 대화는 끝났어요')).toBeInViewport();
});

test('진행 중인 세션은 "관전하기" 로 들어가면 남은 턴이 실시간으로 붙고 끝나면 종료를 알린다', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/sim');

  await page.getByRole('button', { name: '하늘 시뮬레이션 관전하기', exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/sim/${RUNNING_SESSION}$`));
  const log = page.getByRole('log', { name: '대화 기록' });
  await expect(log.getByRole('article')).toHaveCount(4);
  await expect(page.getByText('이 대화는 끝났어요')).toHaveCount(0);

  await expect(log.getByRole('article').nth(4)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('세션이 종료됐어요')).toBeVisible({ timeout: 30_000 });
  await expect(log.getByRole('article')).toHaveCount(8);
  await expect(page.getByText('이 대화는 끝났어요')).toBeInViewport();
});

test('매칭 요청 표의 "이동" 은 그 시뮬레이션의 관전 화면으로 간다', async ({ page }) => {
  await signIn(page);
  await page.goto('/simulations');

  await page
    .getByRole('table', { name: '요청 내역' })
    .getByRole('button', { name: '하늘 시뮬레이션으로 이동', exact: true })
    .click();

  await expect(page).toHaveURL(new RegExp(`/sim/${ENDED_SESSION}$`));
});

test('관전 화면은 셸 본문을 여백 없이 채우고, 대화 영역만 스크롤된다', async ({ page }) => {
  await signIn(page);
  await page.goto('/sim/dddddddd-0003-4000-8000-000000000003');
  await expect(page.getByText('이 대화는 끝났어요')).toBeVisible();
  await expect(page.locator('main > div').first()).toHaveCSS('opacity', '1');

  const main = await page.locator('main').boundingBox();
  const screenBox = await page.locator('main [data-shell-flush]').boundingBox();
  const header = await page.locator('main header').boundingBox();
  const endedBar = await page.getByText('이 대화는 끝났어요').locator('..').boundingBox();
  if (main === null || screenBox === null || header === null || endedBar === null) {
    throw new Error('레이아웃 측정 실패');
  }

  expect(screenBox.x).toBeCloseTo(main.x, 0);
  expect(screenBox.y).toBeCloseTo(main.y, 0);
  expect(screenBox.width).toBeCloseTo(main.width, 0);
  expect(screenBox.height).toBeCloseTo(main.height, 0);
  expect(header.y).toBeCloseTo(main.y, 0);
  expect(header.x + header.width).toBeCloseTo(main.x + main.width, 0);
  expect(endedBar.y + endedBar.height).toBeCloseTo(main.y + main.height, 0);

  const mainScrolls = await page
    .locator('main')
    .evaluate((el) => el.scrollHeight > el.clientHeight);
  expect(mainScrolls).toBe(false);
});

test('넓은 화면에서는 대화 왼쪽에 시뮬레이션 목록이 붙고, 다른 행을 누르면 그 대화로 바뀐다', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', '목록은 1024px 이상에서만 펼친다');
  await signIn(page);
  await page.goto('/sim/dddddddd-0003-4000-8000-000000000003');

  const pane = page.getByRole('navigation', { name: '시뮬레이션 목록' });
  await expect(pane).toBeVisible();
  const main = await page.locator('main').boundingBox();
  const paneBox = await pane.boundingBox();
  const header = await page.locator('main header').boundingBox();
  if (main === null || paneBox === null || header === null) throw new Error('레이아웃 측정 실패');
  expect(paneBox.x).toBeCloseTo(main.x, 0);
  expect(paneBox.width).toBeCloseTo(280, 0);
  expect(header.x).toBeCloseTo(paneBox.x + paneBox.width, 0);

  // 이름 길이가 달라도 이름과 해시태그 사이 간격은 같다.
  const gapAfterName = async (name: string, tag: string): Promise<number> => {
    const title = page.getByRole('heading', { level: 1 });
    const nameBox = await title.getByText(name, { exact: true }).boundingBox();
    const tagBox = await title.getByText(tag, { exact: true }).boundingBox();
    if (nameBox === null || tagBox === null) throw new Error('레이아웃 측정 실패');
    return Math.round(tagBox.x - (nameBox.x + nameBox.width));
  };
  expect(await gapAfterName('hyunwoo', '#HW4K7Z')).toBe(await gapAfterName('Moonlit', '#Q5WN8Z'));

  // 상태는 글자 없이 동그라미로만 보인다.
  await expect(pane.getByRole('img', { name: '진행 중' })).toBeVisible();
  await expect(pane.getByText('진행 중')).toHaveCount(0);

  await pane.getByRole('link', { name: /여름.*Moonlit/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('여름');
  await expect(
    page.getByRole('navigation', { name: '시뮬레이션 목록' }).locator('[aria-current="page"]')
  ).toContainText('여름');
});

test('시뮬레이션 목록을 접으면 화살표 버튼만 남고 대화가 그만큼 넓어진다', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', '목록은 1024px 이상에서만 펼친다');
  await signIn(page);
  await page.goto('/sim/dddddddd-0003-4000-8000-000000000003');

  const pane = page.getByRole('navigation', { name: '시뮬레이션 목록' });
  await pane.getByRole('button', { name: '시뮬레이션 목록 접기' }).click();

  const expand = pane.getByRole('button', { name: '시뮬레이션 목록 펼치기' });
  await expect(expand).toBeVisible();
  await expect(pane.getByRole('link')).toHaveCount(0);
  const main = await page.locator('main').boundingBox();
  const paneBox = await pane.boundingBox();
  const header = await page.locator('main header').boundingBox();
  const expandBox = await expand.boundingBox();
  if (main === null || paneBox === null || header === null || expandBox === null) {
    throw new Error('레이아웃 측정 실패');
  }
  expect(paneBox.width).toBeCloseTo(48, 0);
  expect(header.x).toBeCloseTo(paneBox.x + paneBox.width, 0);
  expect(main.y + main.height - (expandBox.y + expandBox.height)).toBeLessThan(16);

  await expand.click();
  await expect(pane.getByRole('link')).toHaveCount(4);
});

test('좁은 화면에서는 시뮬레이션 목록을 접고 대화만 보인다', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'webkit', 'iPhone 14 뷰포트에서 본다');
  await signIn(page);
  await page.goto('/sim/dddddddd-0003-4000-8000-000000000003');

  await expect(page.getByText('이 대화는 끝났어요')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '시뮬레이션 목록' })).toBeHidden();
});

test('시뮬레이션 목록은 좁은 화면에서도 가로로 넘치지 않는다', async ({ page }) => {
  await signIn(page);
  await page.goto('/sim');
  await expect(page.getByRole('table', { name: '끝난 시뮬레이션' })).toBeVisible();

  const overflows = await page.locator('main').evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflows).toBe(false);
});
