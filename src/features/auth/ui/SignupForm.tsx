import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { useMemo } from 'react';
import { Button } from '@shared/ui/Button';
import { useSignup } from '../api/useSignup';
import { useToast } from '@shared/ui/Toast/useToast';
import { mapServerError } from '../lib/mapServerError';
import { signupFormSchema } from '@entities/auth/model';
import type { SignupForm as SignupFormValues } from '@entities/auth/model';

type SignupFormProps = {
  onSuccess?: () => void;
};

// UI 강도 표시 전용 — entities/auth/model.ts 의 hasThreeOfFour 와 의도적으로 독립 유지.
// hasThreeOfFour 는 submit 검증 gate(통과/불통과), 이쪽은 4-단계 UX score 라 분리.
function computePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (password.length === 0) return { score: 0, label: '비밀번호를 입력해주세요' };
  let categories = 0;
  if (/[A-Z]/.test(password)) categories++;
  if (/[a-z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^A-Za-z0-9]/.test(password)) categories++;
  const longEnough = password.length >= 8;
  if (!longEnough) return { score: 1, label: '8자 이상 필요' };
  if (categories <= 1) return { score: 1, label: '약함' };
  if (categories === 2) return { score: 2, label: '보통' };
  if (categories === 3) return { score: 3, label: '강함' };
  return { score: 4, label: '매우 강함' };
}

const STRENGTH_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-bg-elev-3',
  1: 'bg-danger',
  2: 'bg-warning',
  3: 'bg-success',
  4: 'bg-success',
};

const STRENGTH_TEXT_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'text-text-3',
  1: 'text-danger',
  2: 'text-warning',
  3: 'text-success',
  4: 'text-success',
};

export function SignupForm({ onSuccess }: SignupFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: '',
      nickname: '',
      password: '',
      termsAgreed: false,
      marketingOptIn: false,
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const { mutateAsync, isPending } = useSignup();
  const { show: showToast } = useToast();

  const isLoading = isSubmitting || isPending;

  const passwordValue = watch('password');
  const strength = useMemo(() => computePasswordStrength(passwordValue), [passwordValue]);

  const onSubmit = async (values: SignupFormValues) => {
    // termsAgreed / marketingOptIn 은 서버 payload 비포함 — 와이어프레임 미명세 + 사용자 결정
    // (인수인계 plan §5.1). 클라이언트 측 폼 검증·로컬 기록 용도로만 사용.
    try {
      await mutateAsync({
        email: values.email,
        nickname: values.nickname,
        password: values.password,
      });
      onSuccess?.();
    } catch (err) {
      mapServerError(err, setError, showToast, 'signup');
    }
  };

  const handleFormSubmit = handleSubmit(onSubmit);

  return (
    <form
      onSubmit={(e) => {
        void handleFormSubmit(e);
      }}
      noValidate
    >
      <div className="flex flex-col gap-4">
        {errors.root?.message && (
          <div
            role="alert"
            aria-live="polite"
            className="text-danger text-body-sm border-danger/30 bg-danger/5 rounded-sm border px-3 py-2"
          >
            ✕ {errors.root.message}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled
            className="bg-bg-elev-2 border-border-hi text-text-2 text-ui hover:text-text font-ui flex h-9 items-center justify-center rounded-sm border disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Google 로 계속하기 (준비 중)"
          >
            Google로 계속하기
          </button>
          <button
            type="button"
            disabled
            className="bg-bg-elev-2 border-border-hi text-text-2 text-ui hover:text-text font-ui flex h-9 items-center justify-center rounded-sm border disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Apple 로 계속하기 (준비 중)"
          >
            Apple로 계속하기
          </button>
        </div>

        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="bg-border h-px flex-1" />
          <span className="text-mono-meta text-text-3 font-mono">OR</span>
          <span className="bg-border h-px flex-1" />
        </div>

        <div>
          <label htmlFor="signup-email" className="font-ui text-ui text-text mb-2 block">
            이메일
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            className={`bg-bg text-body text-text placeholder:text-text-3 h-10 w-full rounded-sm border px-3 ${errors.email ? 'border-danger' : 'border-border-hi'} focus:border-brand focus:outline-none`}
            {...register('email')}
          />
          {errors.email?.message && (
            <p
              id="signup-email-error"
              role="alert"
              className="text-mono-meta text-danger mt-1 font-mono"
            >
              ✕ {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-nickname" className="font-ui text-ui text-text mb-2 block">
            닉네임
          </label>
          <input
            id="signup-nickname"
            type="text"
            autoComplete="nickname"
            placeholder="서비스에서 사용할 닉네임"
            aria-invalid={errors.nickname ? true : undefined}
            aria-describedby={errors.nickname ? 'signup-nickname-error' : undefined}
            className={`bg-bg text-body text-text placeholder:text-text-3 h-10 w-full rounded-sm border px-3 ${errors.nickname ? 'border-danger' : 'border-border-hi'} focus:border-brand focus:outline-none`}
            {...register('nickname')}
          />
          {errors.nickname?.message && (
            <p
              id="signup-nickname-error"
              role="alert"
              className="text-mono-meta text-danger mt-1 font-mono"
            >
              ✕ {errors.nickname.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-password" className="font-ui text-ui text-text mb-2 block">
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? 'signup-password-error' : 'signup-password-strength'
            }
            placeholder="••••••••"
            className={`bg-bg text-body text-text placeholder:text-text-3 h-10 w-full rounded-sm border px-3 ${errors.password ? 'border-danger' : 'border-border-hi'} focus:border-brand focus:outline-none`}
            {...register('password')}
          />
          <div
            id="signup-password-strength"
            className="mt-2 flex items-center gap-2"
            aria-live="polite"
          >
            <div className="bg-bg-elev-3 relative h-1 flex-1 overflow-hidden rounded-sm">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={strength.score}
                aria-label="비밀번호 강도"
                className={`h-full ${STRENGTH_COLORS[strength.score]} transition-[width] duration-[var(--duration-base)] ease-[var(--ease)]`}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
            <span className={`text-mono-meta font-mono ${STRENGTH_TEXT_COLORS[strength.score]}`}>
              {strength.label}
            </span>
          </div>
          {errors.password?.message && (
            <p
              id="signup-password-error"
              role="alert"
              className="text-mono-meta text-danger mt-1 font-mono"
            >
              ✕ {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-body-sm text-text-2 flex items-center gap-2">
            <input
              id="signup-terms"
              type="checkbox"
              aria-invalid={errors.termsAgreed ? true : undefined}
              aria-describedby={errors.termsAgreed ? 'signup-terms-error' : undefined}
              className={`accent-brand h-4 w-4 rounded-sm border ${errors.termsAgreed ? 'border-danger outline-danger outline outline-1' : 'border-border-hi'}`}
              {...register('termsAgreed')}
            />
            <label htmlFor="signup-terms">
              만 19세 이상이며 약관에 동의 <span className="text-danger">*</span>
            </label>
          </div>
          {errors.termsAgreed?.message && (
            <p
              id="signup-terms-error"
              role="alert"
              className="text-mono-meta text-danger ml-6 font-mono"
            >
              ✕ {errors.termsAgreed.message}
            </p>
          )}
          <div className="text-body-sm text-text-2 flex items-center gap-2">
            <input
              id="signup-marketing"
              type="checkbox"
              className="border-border-hi accent-brand h-4 w-4 rounded-sm border"
              {...register('marketingOptIn')}
            />
            <label htmlFor="signup-marketing">알림 수신 (선택)</label>
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? '가입 중...' : '계정 만들기 →'}
        </Button>

        <p className="text-mono-meta text-text-3 font-mono">
          본인 인증은 실제 매칭 시점에 진행됩니다
        </p>

        <Link to="/login" className="group text-body-sm text-text-2 hover:text-text mx-auto w-fit">
          이미 계정? <span className="text-brand group-hover:text-brand-hover">로그인</span>
        </Link>
      </div>
    </form>
  );
}
