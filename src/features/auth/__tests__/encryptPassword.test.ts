import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEncrypt = vi.fn();

vi.mock('jsencrypt', () => {
  return {
    JSEncrypt: vi.fn().mockImplementation(() => ({
      setPublicKey: vi.fn(),
      encrypt: mockEncrypt,
    })),
  };
});

describe('encryptPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('encrypt()가 성공하면 암호화된 문자열을 반환한다', async () => {
    mockEncrypt.mockReturnValue('encrypted-base64-string==');

    const { encryptPassword } = await import('../lib/encryptPassword');
    const result = encryptPassword('hunter2', 'MOCK_PUBLIC_KEY');

    expect(mockEncrypt).toHaveBeenCalledWith('hunter2');
    expect(result).toBe('encrypted-base64-string==');
  });

  it('encrypt()가 false를 반환하면 EncryptionError를 throw한다', async () => {
    mockEncrypt.mockReturnValue(false);

    vi.resetModules();
    vi.mock('jsencrypt', () => {
      return {
        JSEncrypt: vi.fn().mockImplementation(() => ({
          setPublicKey: vi.fn(),
          encrypt: mockEncrypt,
        })),
      };
    });

    const { encryptPassword } = await import('../lib/encryptPassword');

    expect(() => encryptPassword('hunter2', 'MOCK_PUBLIC_KEY')).toThrow();
  });

  it('encrypt()가 null을 반환하면 EncryptionError를 throw한다', async () => {
    mockEncrypt.mockReturnValue(null);

    vi.resetModules();
    vi.mock('jsencrypt', () => {
      return {
        JSEncrypt: vi.fn().mockImplementation(() => ({
          setPublicKey: vi.fn(),
          encrypt: mockEncrypt,
        })),
      };
    });

    const { encryptPassword } = await import('../lib/encryptPassword');

    expect(() => encryptPassword('hunter2', 'MOCK_PUBLIC_KEY')).toThrow();
  });
});
