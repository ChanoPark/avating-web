import { test, expect } from '@playwright/test';

const MOCK_PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7o3Lt5Os/s0RJxfWQh5uXwyHLwPPN84q/6RebAD6aCFz' +
  'NupPuqqiK2eAVSpz4rbR3tkfngulif9AL0CS9oVszjdIB5HSaIw3euj9iP0HZCmzrJdeAtCSc5QPkKVmirVM5Yvd' +
  'COKUIxu5hGY7kWf7h8IWMqRpglCklwhnq8Qk/9xp/kvHJZXc7R26INtRDM5ABOPw4pU7AM8RifQIJKgQrKTPxxGT' +
  'MzZ/lXrVUdPgoFWNa7GwM2kYuJw9RB4vNHYm5occ744u3CtEpcokXWd0b+h6yziK0CnuiptSRkfV5zvAKgJ/KEY6' +
  'oWeWxrzM7/NRKzUe5pzE+fgxuPy7o4NbMQIDAQAB';

/**
 * Hermetic 환경 증명 — 정적 공개 페이지는 부팅 시 API 호출이 없어 env 주입이 깨지거나
 * 워커가 안 떠도 smoke 테스트가 거짓 통과한다. 인증 없는 public-key 요청을 페이지에서
 * 직접 호출하고 모킹 응답을 확인해 모킹 환경 자체를 검증한다.
 */
test.describe('MSW 모킹 환경 (hermetic)', () => {
  test('빌드 번들에서 GET /api/crypto/public-key 를 가로채 모킹 응답을 반환한다', async ({
    page,
  }) => {
    await page.goto('/');
    // bootstrap() 은 worker.start() 이후에 렌더한다 — #root 가 비어있지 않으면 워커가 이미
    // 떠 있다는 뜻이다.
    await expect(page.locator('#root')).not.toBeEmpty();

    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:8080/api/crypto/public-key');
      return { status: res.status, body: (await res.json()) as unknown };
    });

    expect(result.status).toBe(200);
    // e2e 는 자기완결이라 src import 대신 MOCK_PUBLIC_KEY 값을 복제했다 — 핸들러 키를
    // 바꾸면 여기도 같이 바꿔야 한다.
    expect(result.body).toMatchObject({ data: { publicKey: MOCK_PUBLIC_KEY } });
  });
});
