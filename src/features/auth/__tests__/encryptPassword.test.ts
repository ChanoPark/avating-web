import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEncrypt, mockPublicKeyFromPem, mockEncode64 } = vi.hoisted(() => ({
  mockEncrypt: vi.fn(),
  mockPublicKeyFromPem: vi.fn(),
  mockEncode64: vi.fn((s: string) => Buffer.from(s).toString('base64')),
}));

vi.mock('node-forge', () => ({
  pki: {
    publicKeyFromPem: mockPublicKeyFromPem,
  },
  md: {
    sha256: { create: vi.fn().mockReturnValue({ algorithm: 'sha256' }) },
    sha1: { create: vi.fn().mockReturnValue({ algorithm: 'sha1' }) },
  },
  util: {
    encode64: mockEncode64,
  },
}));

describe('encryptPassword', () => {
  beforeEach(() => {
    mockEncrypt.mockReset();
    mockPublicKeyFromPem.mockReset();
    mockEncode64.mockReset();
    mockPublicKeyFromPem.mockReturnValue({ encrypt: mockEncrypt });
    mockEncode64.mockImplementation((s: string) => Buffer.from(s).toString('base64'));
  });

  it('encrypt()가 성공하면 Base64 인코딩된 문자열을 반환한다', async () => {
    mockEncrypt.mockReturnValue('encrypted-bytes');

    const { encryptPassword } = await import('../lib/encryptPassword');
    const result = encryptPassword('hunter2', 'MOCK_BASE64_PUBLIC_KEY');

    expect(mockPublicKeyFromPem).toHaveBeenCalledWith(
      expect.stringContaining('-----BEGIN PUBLIC KEY-----')
    );
    expect(mockEncrypt).toHaveBeenCalledWith(
      'hunter2',
      'RSA-OAEP',
      expect.objectContaining({
        md: expect.objectContaining({ algorithm: 'sha256' }),
        mgf1: expect.objectContaining({ md: expect.objectContaining({ algorithm: 'sha1' }) }),
      })
    );
    expect(typeof result).toBe('string');
  });

  it('publicKeyFromPem이 실패하면 EncryptionError를 throw한다', async () => {
    mockPublicKeyFromPem.mockImplementation(() => {
      throw new Error('invalid PEM');
    });

    const { encryptPassword, EncryptionError } = await import('../lib/encryptPassword');
    expect(() => encryptPassword('hunter2', 'BAD_KEY')).toThrow(EncryptionError);
  });

  it('encrypt()가 실패하면 EncryptionError를 throw한다', async () => {
    mockEncrypt.mockImplementation(() => {
      throw new Error('encrypt failed');
    });

    const { encryptPassword, EncryptionError } = await import('../lib/encryptPassword');
    expect(() => encryptPassword('hunter2', 'MOCK_BASE64_PUBLIC_KEY')).toThrow(EncryptionError);
  });
});
