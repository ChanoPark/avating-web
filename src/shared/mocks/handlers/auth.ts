import { http, HttpResponse } from 'msw';
import { SERVER_ERROR_CODES } from '@shared/api/errorCodes';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const mockTokenResponse = {
  data: {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
  },
};

// 테스트 전용 RSA 공개키(비밀값 아님) — 형식이 깨지면 encryptPassword 가 EncryptionError 를
// 던져 로그인 자체가 막히고, 인증 게이트 화면을 전부 시각 검증하지 못한다.
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

export const mockSessionResponse = {
  data: {
    email: 'coach@avating.app',
    nickname: '코치',
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

  http.get(`${BASE_URL}/api/auth/me`, () => {
    return HttpResponse.json(mockSessionResponse);
  }),
];

export const loginHandlers = {
  success: http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json(mockTokenResponse);
  }),

  notFound: http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json(
      { message: '회원을 찾을 수 없습니다.', code: SERVER_ERROR_CODES.AUTH_MEMBER_NOT_FOUND },
      { status: 404 }
    );
  }),

  // 문구는 404(회원 없음)와 같아야 한다 — 계정 열거를 막기 위해서다.
  passwordMismatch: http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json(
      { message: '비밀번호가 일치하지 않습니다.', code: SERVER_ERROR_CODES.AUTH_PASSWORD_MISMATCH },
      { status: 400 }
    );
  }),

  badRequest: http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json({ message: '잘못된 입력입니다.' }, { status: 400 });
  }),

  rsaFailure: http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json(
      { message: '비밀번호 복호화에 실패했습니다.', code: SERVER_ERROR_CODES.AUTH_DECRYPT_FAILED },
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
      { message: '이미 사용 중인 이메일이에요.', code: SERVER_ERROR_CODES.MEMBER_EMAIL_CONFLICT },
      { status: 409 }
    );
  }),

  nicknameConflict: http.post(`${BASE_URL}/api/auth/signup`, () => {
    return HttpResponse.json(
      {
        message: '이미 사용 중인 닉네임이에요.',
        code: SERVER_ERROR_CODES.MEMBER_NICKNAME_CONFLICT,
      },
      { status: 409 }
    );
  }),

  passwordPolicyViolation: http.post(`${BASE_URL}/api/auth/signup`, () => {
    return HttpResponse.json(
      {
        message: '비밀번호 형식이 올바르지 않습니다.',
        code: SERVER_ERROR_CODES.AUTH_PASSWORD_POLICY_WEAK,
      },
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
