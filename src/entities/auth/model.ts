import { z } from 'zod';

// 서버 비밀번호 정책(api-guide §2.2, AUTH_422_001/002) — 비밀번호는 RSA 암호화라 서버는 복호화 후에야 검증하므로 여기서 먼저 막는다.
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

// ASCII 33~126 중 영숫자가 아닌 문자만 특수문자로 본다 — 공백·한글·이모지는 서버도 특수문자로 치지 않는다.
const ASCII_SPECIAL_RANGES: readonly (readonly [number, number])[] = [
  [33, 47], // ! " # $ % & ' ( ) * + , - . /
  [58, 64], // : ; < = > ? @
  [91, 96], // [ \ ] ^ _ `
  [123, 126], // { | } ~
];

function hasAsciiSpecial(password: string): boolean {
  for (let i = 0; i < password.length; i += 1) {
    const code = password.charCodeAt(i);
    if (ASCII_SPECIAL_RANGES.some(([lo, hi]) => code >= lo && code <= hi)) return true;
  }
  return false;
}

function hasAllRequiredCategories(password: string): boolean {
  return /[A-Za-z]/.test(password) && /[0-9]/.test(password) && hasAsciiSpecial(password);
}

export const emailSchema = z
  .string()
  .min(1, '이메일을 입력해주세요')
  .email('올바른 이메일 형식이 아닙니다');

export const rawPasswordSchema = z
  .string()
  .min(1, '비밀번호를 입력해주세요')
  .min(PASSWORD_MIN, `${String(PASSWORD_MIN)}자 이상 입력해주세요`)
  .max(PASSWORD_MAX, `${String(PASSWORD_MAX)}자 이하로 입력해주세요`)
  .refine(hasAllRequiredCategories, '영문자·숫자·특수문자를 각각 1개 이상 포함해주세요');

// 서버 상한은 2–30자이지만(실서버 /v3/api-docs) 카드·사이드바 슬롯이 12자 기준이라 폼 상한은 12자로 좁힌다.
export const nicknameSchema = z
  .string()
  .trim()
  .min(1, '닉네임을 입력해주세요')
  .min(2, '2자 이상 입력해주세요')
  .max(12, '12자 이하로 입력해주세요');

// 로그인은 존재 여부만 본다 — 서버도 로그인(api-guide §2.3)에서는 비밀번호 정책을 안 본다(AUTH_422_001/002 는 §2.2 가입 전용). 여기서 걸면 옛 규칙 계정이 클라이언트에서만 막힌다.
export const loginPasswordSchema = z.string().min(1, '비밀번호를 입력해주세요');

export const loginFormSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const signupFormSchema = z
  .object({
    email: emailSchema,
    nickname: nicknameSchema,
    password: rawPasswordSchema,
    termsAgreed: z.boolean(),
    marketingOptIn: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    if (!val.termsAgreed) {
      ctx.addIssue({
        code: 'custom',
        path: ['termsAgreed'],
        message: '약관에 동의해주세요',
      });
    }
  });

export const loginRequestSchema = z.object({
  email: emailSchema,
  encryptedPassword: z.string().min(1),
});

export const signupRequestSchema = z.object({
  email: emailSchema,
  encryptedPassword: z.string().min(1),
  nickname: nicknameSchema,
});

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const apiResponseAuthToken = z.object({
  data: authTokenResponseSchema,
});

// 부팅 검증(`GET /api/auth/me`) 응답 — nicknameSchema(폼 전용 12자 상한)로 검증하면 서버 상한(30자) 닉네임에서 부팅이 깨진다.
const sessionResponseSchema = z.object({
  email: z.string().min(1),
  nickname: z.string().min(1),
});

export const apiResponseSession = z.object({
  data: sessionResponseSchema,
});

export const publicKeyResponseSchema = z.object({
  publicKey: z.string().min(1),
});

export const apiResponsePublicKey = z.object({
  data: publicKeyResponseSchema,
});

export type LoginForm = z.infer<typeof loginFormSchema>;
export type SignupForm = z.infer<typeof signupFormSchema>;
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type PublicKeyResponse = z.infer<typeof publicKeyResponseSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SignupRequest = z.infer<typeof signupRequestSchema>;
