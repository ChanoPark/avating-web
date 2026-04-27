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

export const mockPublicKeyResponse = {
  data: {
    publicKey: 'mock-rsa-public-key',
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
};

export const publicKeyHandlers = {
  success: http.get(`${BASE_URL}/api/crypto/public-key`, () => {
    return HttpResponse.json(mockPublicKeyResponse);
  }),

  serverError: http.get(`${BASE_URL}/api/crypto/public-key`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};
