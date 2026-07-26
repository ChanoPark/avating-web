import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const mockTokenResponse = {
  data: {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
  },
};

/** 테스트·개발 전용 RSA-2048 **공개**키 (SPKI DER base64). 비밀값이 아니다 —
 *  대응하는 개인키는 어디에도 없고, mock 서버는 복호화하지 않는다.
 *
 *  유효한 키여야 하는 이유: `encryptPassword` 가 이 값을 PEM 헤더로 감싸
 *  `forge.pki.publicKeyFromPem` 에 넘긴다. 형식이 깨져 있으면 `EncryptionError`
 *  가 나면서 **브라우저에서 로그인 자체가 불가능**해지고, 그 여파로 인증 게이트
 *  화면(`/dashboard` · `/avatars/:id` · `/onboarding/*`)의 시각 검증이 전부 막힌다. */
export const MOCK_PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7o3Lt5Os/s0RJxfWQh5uXwyHLwPPN84q/6RebAD6aCFz' +
  'NupPuqqiK2eAVSpz4rbR3tkfngulif9AL0CS9oVszjdIB5HSaIw3euj9iP0HZCmzrJdeAtCSc5QPkKVmirVM5Yvd' +
  'COKUIxu5hGY7kWf7h8IWMqRpglCklwhnq8Qk/9xp/kvHJZXc7R26INtRDM5ABOPw4pU7AM8RifQIJKgQrKTPxxGT' +
  'MzZ/lXrVUdPgoFWNa7GwM2kYuJw9RB4vNHYm5occ744u3CtEpcokXWd0b+h6yziK0CnuiptSRkfV5zvAKgJ/KEY6' +
  'oWeWxrzM7/NRKzUe5pzE+fgxuPy7o4NbMQIDAQAB';

export const mockPublicKeyResponse = {
  data: {
    publicKey: MOCK_PUBLIC_KEY,
  },
};

export const authHandlers = [
  http.get(`${BASE_URL}/api/crypto/public-key`, () => {
    return HttpResponse.json(mockPublicKeyResponse);
  }),

  http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json(mockTokenResponse);
  }),

  http.post(`${BASE_URL}/api/auth/signup`, () => {
    return HttpResponse.json(mockTokenResponse, { status: 201 });
  }),

  http.post(`${BASE_URL}/api/auth/refresh`, () => {
    return HttpResponse.json(mockTokenResponse);
  }),
];

export const loginHandlers = {
  success: http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json(mockTokenResponse);
  }),

  notFound: http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json(
      { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 404 }
    );
  }),

  badRequest: http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json({ message: '잘못된 입력입니다.' }, { status: 400 });
  }),

  rsaFailure: http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json(
      { message: 'RSA 복호화 실패', code: 'RSA_DECRYPT_FAILED' },
      { status: 422 }
    );
  }),
};

export const signupHandlers = {
  success: http.post(`${BASE_URL}/api/auth/signup`, () => {
    return HttpResponse.json(mockTokenResponse, { status: 201 });
  }),

  emailConflict: http.post(`${BASE_URL}/api/auth/signup`, () => {
    return HttpResponse.json(
      { message: '이미 사용 중인 이메일이에요.', code: 'EMAIL_CONFLICT' },
      { status: 409 }
    );
  }),

  nicknameConflict: http.post(`${BASE_URL}/api/auth/signup`, () => {
    return HttpResponse.json(
      { message: '이미 사용 중인 닉네임이에요.', code: 'NICKNAME_CONFLICT' },
      { status: 409 }
    );
  }),

  passwordPolicyViolation: http.post(`${BASE_URL}/api/auth/signup`, () => {
    return HttpResponse.json(
      { message: '비밀번호 정책을 만족하지 않습니다.', code: 'PASSWORD_POLICY_VIOLATION' },
      { status: 422 }
    );
  }),

  badRequest: http.post(`${BASE_URL}/api/auth/signup`, () => {
    return HttpResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 });
  }),
};

export const publicKeyHandlers = {
  success: http.get(`${BASE_URL}/api/crypto/public-key`, () => {
    return HttpResponse.json(mockPublicKeyResponse);
  }),

  serverError: http.get(`${BASE_URL}/api/crypto/public-key`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};
