import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { useLogin } from '../api/useLogin';
import { useToast } from '@shared/ui/Toast/useToast';
import { mapServerError } from '../lib/mapServerError';
import { loginFormSchema } from '@entities/auth/model';
import type { LoginForm as LoginFormValues } from '@entities/auth/model';

type LoginFormProps = {
  onSuccess?: () => void;
};

// 폼 입력 계약은 shared/ui/Input 의 base 와 같다 — caption(13px) · radius `--r-sm` ·
// padding 9px 12px · placeholder 는 `--ink-mute`(`--ink-faint` 금지).
const inputBase =
  'bg-canvas text-caption text-ink placeholder:text-ink-mute w-full rounded-sm border px-3 py-2.25 transition-colors duration-[var(--dur-fast)] ease-brand focus:outline-none focus-visible:shadow-focus';

// 아직 화면이 없는 보조 액션의 표기 — disabled 버튼 + 준비 중 title (레포 공통 관례).
const oauthButton =
  'bg-surface border-hairline-input text-ink-secondary text-body-sm rounded-pill flex h-10 items-center justify-center border disabled:cursor-not-allowed disabled:opacity-70';

export function LoginForm({ onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const { mutateAsync, isPending } = useLogin();
  const { show: showToast } = useToast();

  const isLoading = isSubmitting || isPending;

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await mutateAsync({ email: values.email, password: values.password });
      onSuccess?.();
    } catch (err) {
      mapServerError(err, setError, showToast, 'login');
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
      <div className="flex flex-col gap-5">
        {/* 폼 전체 실패는 상단 배너 하나로만 알린다 — 필드 오류는 각 필드 아래 인라인. */}
        {errors.root?.message && (
          <div
            role="alert"
            aria-live="polite"
            className="text-danger text-caption bg-danger-wash flex items-start gap-1.5 rounded-sm px-3 py-2"
          >
            <CircleAlert
              size={13}
              strokeWidth={1.5}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            {errors.root.message}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled
            className={oauthButton}
            aria-label="Google 로 계속하기 (준비 중)"
          >
            Google로 계속하기
          </button>
          <button
            type="button"
            disabled
            className={oauthButton}
            aria-label="Apple 로 계속하기 (준비 중)"
          >
            Apple로 계속하기
          </button>
        </div>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="bg-hairline h-px flex-1" />
          <span className="text-micro text-ink-mute">OR</span>
          <span className="bg-hairline h-px flex-1" />
        </div>

        {/* 필드 그룹 — 정본 Col gap 14 */}
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="text-caption text-ink-secondary font-medium">
              이메일
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className={`${inputBase} ${errors.email ? 'border-danger focus:border-danger' : 'border-hairline-input focus:border-primary'}`}
              {...register('email')}
            />
            {errors.email?.message && (
              <p
                id="login-email-error"
                role="alert"
                className="text-micro text-danger flex items-center gap-1"
              >
                <CircleAlert size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="login-password" className="text-caption text-ink-secondary font-medium">
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              className={`${inputBase} ${errors.password ? 'border-danger focus:border-danger' : 'border-hairline-input focus:border-primary'}`}
              {...register('password')}
            />
            {errors.password?.message && (
              <p
                id="login-password-error"
                role="alert"
                className="text-micro text-danger flex items-center gap-1"
              >
                <CircleAlert size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* 정본 Row between — 로그인 상태 유지 / 비밀번호 찾기 (둘 다 준비 중) */}
          <div className="flex items-center justify-between">
            <div className="text-caption text-ink-secondary flex items-center gap-2">
              <input
                id="login-remember"
                type="checkbox"
                disabled
                className="border-hairline-input accent-primary h-4 w-4 rounded-sm border disabled:cursor-not-allowed disabled:opacity-70"
              />
              <label
                htmlFor="login-remember"
                title="로그인 상태 유지 (준비 중)"
                className="text-ink-mute"
              >
                로그인 상태 유지
              </label>
            </div>
            <button
              type="button"
              disabled
              title="비밀번호 찾기 (준비 중)"
              className="text-caption text-ink-mute disabled:cursor-not-allowed disabled:opacity-70"
            >
              비밀번호 찾기
            </button>
          </div>
        </div>

        <Button type="submit" variant="primary" block disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? '로그인 중...' : '로그인'}
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>

        <div className="text-caption flex items-center justify-center gap-1.5">
          <span className="text-ink-mute">계정이 없나요?</span>
          <Link to="/signup" className="text-primary hover:text-primary-hover font-medium">
            가입하기
          </Link>
        </div>
      </div>
    </form>
  );
}
