import { test, expect } from '@playwright/test';

/**
 * Hermetic 환경 증명 — 빌드된 번들에서 MSW 워커가 실제로 요청을 가로채는지 검증.
 *
 * 왜 이 테스트가 필요한가:
 *   정적 공개 페이지(/, /login)는 부팅 시 API 호출이 없고, 앱은
 *   `worker.start({ onUnhandledRequest: 'bypass' })` 로 동작한다(src/main.tsx).
 *   즉 env 주입이 깨지거나(VITE_API_BASE_URL 불일치) 워커가 기동되지 않아도
 *   화면은 멀쩡히 렌더되어 단순 smoke 테스트가 '거짓 통과' 한다.
 *   이 테스트는 인증이 필요 없는 GET /api/crypto/public-key 를 페이지 컨텍스트에서
 *   직접 호출하고 모킹 응답(200 + 고정 바디)을 단언함으로써 모킹 환경 자체를 검증한다.
 *   주입이 깨지면 요청이 실 네트워크(localhost:8080, 서버 없음)로 새어 실패한다.
 */
test.describe('MSW 모킹 환경 (hermetic)', () => {
  test('빌드 번들에서 GET /api/crypto/public-key 를 가로채 모킹 응답을 반환한다', async ({
    page,
  }) => {
    await page.goto('/');
    // bootstrap() 은 `await worker.start()` 이후에 createRoot().render() 한다.
    // 따라서 #root 가 비어있지 않다 == 워커가 이미 페이지를 제어 중이다.
    await expect(page.locator('#root')).not.toBeEmpty();

    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:8080/api/crypto/public-key');
      return { status: res.status, body: (await res.json()) as unknown };
    });

    expect(result.status).toBe(200);
    // 모킹 핸들러(src/shared/mocks/handlers/auth.ts)의 고정 응답.
    expect(result.body).toMatchObject({ data: { publicKey: 'mock-rsa-public-key' } });
  });
});
