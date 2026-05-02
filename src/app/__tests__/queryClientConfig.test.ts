import { describe, it, expect } from 'vitest';
import { queryClientConfig } from '../queryClientConfig';

describe('queryClientConfig', () => {
  it('서버 부하 완화를 위한 기본 옵션이 회귀 없이 유지된다', () => {
    expect(queryClientConfig.defaultOptions?.queries).toMatchObject({
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    });
  });
});
