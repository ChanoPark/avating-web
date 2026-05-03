import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env 파싱', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('유효한 환경 변수로 파싱이 성공한다', async () => {
    vi.stubEnv('MODE', 'test');
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080');
    vi.stubEnv('VITE_API_MODE', 'mock');

    const { env } = await import('../env');
    expect(env.VITE_API_BASE_URL).toBe('http://localhost:8080');
    expect(env.VITE_API_MODE).toBe('mock');
  });

  it('MODE 가 허용되지 않는 값이면 에러를 throw 한다', async () => {
    vi.stubEnv('MODE', 'invalid-mode');
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080');
    vi.stubEnv('VITE_API_MODE', 'mock');

    await expect(import('../env')).rejects.toThrow(/Invalid environment configuration/);
  });

  it('VITE_API_BASE_URL 이 유효한 URL 이 아니면 에러를 throw 한다', async () => {
    vi.stubEnv('MODE', 'test');
    vi.stubEnv('VITE_API_BASE_URL', 'not-a-url');
    vi.stubEnv('VITE_API_MODE', 'mock');

    await expect(import('../env')).rejects.toThrow(/Invalid environment configuration/);
  });
});
