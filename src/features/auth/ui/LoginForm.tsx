import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { FIELD_CLASS, FIELD_ERROR_CLASS } from '@shared/ui/Input';
import { Banner } from '@shared/ui/Banner';
import { useLogin } from '../api/useLogin';
import { useToast } from '@shared/ui/Toast/useToast';
import { mapServerError } from '../lib/mapServerError';
import { loginFormSchema } from '@entities/auth/model';
import type { LoginForm as LoginFormValues } from '@entities/auth/model';

type LoginFormProps = {
  onSuccess?: () => void;
};

// 아직 화면이 없는 보조 액션의 표기 — disabled 버튼 + 준비 중 title (레포 공통 관례).
const oauthButton =
  'bg-fill-weak text-primary text-btn rounded-card flex h-10 items-center justify-center disabled:bg-raised disabled:text-muted disabled:cursor-not-allowed';

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
        {/* 정본 S-11-07 — 필드 오류는 배너가 아니라 필드 아래 인라인으로 표시한다. */}
        {errors.root?.message && <Banner tone="danger">{errors.root.message}</Banner>}

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
          <span className="bg-subtle h-px flex-1" />
          <span className="text-meta text-secondary">OR</span>
          <span className="bg-subtle h-px flex-1" />
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="text-caption text-secondary font-medium">
              이메일
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className={`${FIELD_CLASS} ${errors.email ? FIELD_ERROR_CLASS : ''}`}
              {...register('email')}
            />
            {errors.email?.message && (
              <p
                id="login-email-error"
                role="alert"
                className="text-meta text-danger flex items-center gap-1"
              >
                <CircleAlert size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="login-password" className="text-caption text-secondary font-medium">
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              className={`${FIELD_CLASS} ${errors.password ? FIELD_ERROR_CLASS : ''}`}
              {...register('password')}
            />
            {errors.password?.message && (
              <p
                id="login-password-error"
                role="alert"
                className="text-meta text-danger flex items-center gap-1"
              >
                <CircleAlert size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-caption text-secondary flex items-center gap-2">
              <input
                id="login-remember"
                type="checkbox"
                disabled
                className="border-field accent-mark rounded-chip h-4 w-4 border disabled:cursor-not-allowed disabled:opacity-70"
              />
              <label
                htmlFor="login-remember"
                title="로그인 상태 유지 (준비 중)"
                className="text-secondary"
              >
                로그인 상태 유지
              </label>
            </div>
            <button
              type="button"
              disabled
              title="비밀번호 찾기 (준비 중)"
              className="text-caption text-secondary disabled:cursor-not-allowed disabled:opacity-70"
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
          <span className="text-secondary">계정이 없나요?</span>
          <Link to="/signup" className="text-action hover:text-action-hover font-medium">
            가입하기
          </Link>
        </div>
      </div>
    </form>
  );
}
