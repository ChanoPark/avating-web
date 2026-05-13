import { z } from 'zod';

function hasThreeOfFour(password: string): boolean {
  const categories = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  return categories.filter(Boolean).length >= 3;
}

export const emailSchema = z
  .string()
  .min(1, '이메일을 입력해주세요')
  .email('올바른 이메일 형식이 아닙니다');

export const rawPasswordSchema = z
  .string()
  .min(1, '비밀번호를 입력해주세요')
  .min(8, '8자 이상 입력해주세요')
  .max(64)
  .refine(hasThreeOfFour, '대/소/숫자/기호 중 3종 이상 포함해주세요');

export const nicknameSchema = z
  .string()
  .trim()
  .min(1, '닉네임을 입력해주세요')
  .min(2, '2자 이상 입력해주세요')
  .max(30, '30자 이하로 입력해주세요');

export const loginFormSchema = z.object({
  email: emailSchema,
  password: rawPasswordSchema,
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

export const publicKeyResponseSchema = z.object({
  publicKey: z.string().min(1),
});

export const apiResponsePublicKey = z.object({
  data: publicKeyResponseSchema,
});

export type LoginForm = z.infer<typeof loginFormSchema>;
export type SignupForm = z.infer<typeof signupFormSchema>;
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>;
export type PublicKeyResponse = z.infer<typeof publicKeyResponseSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SignupRequest = z.infer<typeof signupRequestSchema>;
