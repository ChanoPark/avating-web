import * as forge from 'node-forge';

export class EncryptionError extends Error {
  constructor(cause?: unknown) {
    super('RSA 암호화에 실패했습니다. 공개키를 확인해주세요.');
    this.name = 'EncryptionError';
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export function encryptPassword(plainPassword: string, publicKeyBase64: string): string {
  try {
    const pem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;
    const publicKey = forge.pki.publicKeyFromPem(pem);

    const encrypted = publicKey.encrypt(plainPassword, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha1.create() },
    });

    return forge.util.encode64(encrypted);
  } catch (cause) {
    throw new EncryptionError(cause);
  }
}
