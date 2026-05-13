import { describe, it, expect } from 'vitest';
import {
  loginRequestSchema,
  signupRequestSchema,
  authTokenResponseSchema,
  publicKeyResponseSchema,
  loginFormSchema,
  signupFormSchema,
  apiResponseAuthToken,
  apiResponsePublicKey,
} from '../model';

describe('loginFormSchema', () => {
  it('이메일이 비어있으면 "이메일을 입력해주세요" 에러를 반환한다', () => {
    const result = loginFormSchema.safeParse({ email: '', password: 'Password123!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === 'email');
      expect(emailError?.message).toBe('이메일을 입력해주세요');
    }
  });

  it('이메일 형식이 올바르지 않으면 "올바른 이메일 형식이 아닙니다" 에러를 반환한다', () => {
    const result = loginFormSchema.safeParse({ email: 'abc', password: 'Password123!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === 'email');
      expect(emailError?.message).toBe('올바른 이메일 형식이 아닙니다');
    }
  });

  it('비밀번호가 비어있으면 "비밀번호를 입력해주세요" 에러를 반환한다', () => {
    const result = loginFormSchema.safeParse({ email: 'test@example.com', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find((i) => i.path[0] === 'password');
      expect(passwordError?.message).toBeDefined();
    }
  });

  it('유효한 이메일/비밀번호는 파싱에 성공한다', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@avating.com',
      password: 'Password1!',
    });
    expect(result.success).toBe(true);
  });
});

describe('signupFormSchema', () => {
  const validBase = {
    email: 'user@avating.com',
    nickname: '아바팅유저',
    password: 'Password1!',
    termsAgreed: true,
    marketingOptIn: false,
  };

  it('닉네임이 1자이면 실패한다', () => {
    const result = signupFormSchema.safeParse({ ...validBase, nickname: '나' });
    expect(result.success).toBe(false);
  });

  it('닉네임이 31자이면 실패한다', () => {
    const result = signupFormSchema.safeParse({
      ...validBase,
      nickname: 'a'.repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it('비밀번호가 7자이면 실패한다', () => {
    const result = signupFormSchema.safeParse({
      ...validBase,
      password: 'Pas1!aB',
    });
    expect(result.success).toBe(false);
  });

  it('약관 미동의이면 termsAgreed 에러를 반환한다', () => {
    const result = signupFormSchema.safeParse({
      ...validBase,
      termsAgreed: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const termsError = result.error.issues.find(
        (i) => JSON.stringify(i.path) === JSON.stringify(['termsAgreed'])
      );
      expect(termsError).toBeDefined();
      expect(termsError?.message).toBe('약관에 동의해주세요');
    }
  });

  it('marketingOptIn은 선택이며 기본값 false 로 파싱된다', () => {
    const result = signupFormSchema.safeParse({
      email: 'user@avating.com',
      nickname: '아바팅유저',
      password: 'Password1!',
      termsAgreed: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.marketingOptIn).toBe(false);
    }
  });

  it('유효한 입력은 파싱에 성공한다', () => {
    const result = signupFormSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });
});

describe('loginRequestSchema', () => {
  it('유효한 요청 바디는 파싱에 성공한다', () => {
    const result = loginRequestSchema.safeParse({
      email: 'user@avating.com',
      encryptedPassword: 'base64encrypted==',
    });
    expect(result.success).toBe(true);
  });

  it('encryptedPassword가 없으면 실패한다', () => {
    const result = loginRequestSchema.safeParse({ email: 'user@avating.com' });
    expect(result.success).toBe(false);
  });
});

describe('signupRequestSchema', () => {
  it('유효한 요청 바디는 파싱에 성공한다', () => {
    const result = signupRequestSchema.safeParse({
      email: 'user@avating.com',
      encryptedPassword: 'base64encrypted==',
      nickname: '아바팅유저',
    });
    expect(result.success).toBe(true);
  });

  it('nickname이 없으면 실패한다', () => {
    const result = signupRequestSchema.safeParse({
      email: 'user@avating.com',
      encryptedPassword: 'base64encrypted==',
    });
    expect(result.success).toBe(false);
  });
});

describe('authTokenResponseSchema', () => {
  const validToken = {
    accessToken: 'access-token-value',
    refreshToken: 'refresh-token-value',
    tokenType: 'Bearer',
    expiresIn: 3600,
  };

  it('유효한 토큰 응답은 파싱에 성공한다', () => {
    const result = authTokenResponseSchema.safeParse(validToken);
    expect(result.success).toBe(true);
  });

  it('expiresIn이 0이면 실패한다', () => {
    const result = authTokenResponseSchema.safeParse({ ...validToken, expiresIn: 0 });
    expect(result.success).toBe(false);
  });

  it('accessToken이 빈 문자열이면 실패한다', () => {
    const result = authTokenResponseSchema.safeParse({ ...validToken, accessToken: '' });
    expect(result.success).toBe(false);
  });
});

describe('publicKeyResponseSchema', () => {
  it('publicKey가 있으면 파싱에 성공한다', () => {
    const result = publicKeyResponseSchema.safeParse({ publicKey: 'RSA_PUBLIC_KEY_DATA' });
    expect(result.success).toBe(true);
  });

  it('publicKey가 빈 문자열이면 실패한다', () => {
    const result = publicKeyResponseSchema.safeParse({ publicKey: '' });
    expect(result.success).toBe(false);
  });
});

describe('apiResponseAuthToken', () => {
  it('data 필드가 없으면 파싱이 실패(throw)한다', () => {
    expect(() => {
      apiResponseAuthToken.parse({ other: 'field' });
    }).toThrow();
  });

  it('유효한 구조는 파싱에 성공한다', () => {
    const result = apiResponseAuthToken.safeParse({
      data: {
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('apiResponsePublicKey', () => {
  it('data 필드가 없으면 파싱이 실패(throw)한다', () => {
    expect(() => {
      apiResponsePublicKey.parse({});
    }).toThrow();
  });

  it('유효한 구조는 파싱에 성공한다', () => {
    const result = apiResponsePublicKey.safeParse({
      data: { publicKey: 'RSA_PUBLIC_KEY_DATA' },
    });
    expect(result.success).toBe(true);
  });
});
