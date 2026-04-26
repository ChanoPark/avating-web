import { JSEncrypt } from 'jsencrypt';

export class EncryptionError extends Error {
  constructor() {
    super('RSA 암호화에 실패했습니다. 공개키를 확인해주세요.');
    this.name = 'EncryptionError';
  }
}

export function encryptPassword(plainPassword: string, publicKey: string): string {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey);
  const result = encryptor.encrypt(plainPassword);

  if (!result) {
    throw new EncryptionError();
  }

  return result;
}
