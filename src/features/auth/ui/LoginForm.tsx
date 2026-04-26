import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@shared/ui/Button';
import { useLogin } from '../api/useLogin';
import { useToast } from '@shared/ui/Toast/useToast';
import { mapServerError } from '../lib/mapServerError';
import { loginFormSchema } from '@entities/auth/model';
import type { LoginForm as LoginFormValues } from '@entities/auth/model';

type LoginFormProps = {
  onSuccess?: () => void;
};

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
      <div className="flex flex-col gap-4">
        {errors.root?.message && (
          <div role="alert" aria-live="polite" className="text-danger text-body-sm">
            {errors.root.message}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="font-ui text-ui text-text mb-2 block">
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className={`bg-bg text-body text-text h-10 w-full rounded-sm border px-3 ${errors.email ? 'border-danger' : 'border-border-hi'} focus:border-brand focus:outline-none`}
            {...register('email')}
          />
          {errors.email?.message && (
            <p
              id="login-email-error"
              role="alert"
              className="text-mono-meta text-danger mt-1 font-mono"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="font-ui text-ui text-text mb-2 block">
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            className={`bg-bg text-body text-text h-10 w-full rounded-sm border px-3 ${errors.password ? 'border-danger' : 'border-border-hi'} focus:border-brand focus:outline-none`}
            {...register('password')}
          />
          {errors.password?.message && (
            <p
              id="login-password-error"
              role="alert"
              className="text-mono-meta text-danger mt-1 font-mono"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>

        <a href="/signup" className="text-body-sm text-text-2 hover:text-text text-center">
          회원가입
        </a>
      </div>
    </form>
  );
}
