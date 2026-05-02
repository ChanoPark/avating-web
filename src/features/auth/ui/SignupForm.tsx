import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { Button } from '@shared/ui/Button';
import { useSignup } from '../api/useSignup';
import { useToast } from '@shared/ui/Toast/useToast';
import { mapServerError } from '../lib/mapServerError';
import { signupFormSchema } from '@entities/auth/model';
import type { SignupForm as SignupFormValues } from '@entities/auth/model';

type SignupFormProps = {
  onSuccess?: () => void;
};

export function SignupForm({ onSuccess }: SignupFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { email: '', nickname: '', password: '', passwordConfirm: '' },
    mode: 'onTouched',
  });

  const { mutateAsync, isPending } = useSignup();
  const { show: showToast } = useToast();

  const isLoading = isSubmitting || isPending;

  const onSubmit = async (values: SignupFormValues) => {
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
          <div role="alert" aria-live="polite" className="text-danger text-body-sm">
            {errors.root.message}
          </div>
        )}

        <div>
          <label htmlFor="signup-email" className="font-ui text-ui text-text mb-2 block">
            이메일
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="example@email.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            className={`bg-bg text-body text-text h-10 w-full rounded-sm border px-3 ${errors.email ? 'border-danger' : 'border-border-hi'} focus:border-brand focus:outline-none`}
            {...register('email')}
          />
          {errors.email?.message && (
            <p
              id="signup-email-error"
              role="alert"
              className="text-mono-meta text-danger mt-1 font-mono"
            >
              {errors.email.message}
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
            placeholder="닉네임 (2~30자)"
            aria-invalid={errors.nickname ? true : undefined}
            aria-describedby={errors.nickname ? 'signup-nickname-error' : undefined}
            className={`bg-bg text-body text-text h-10 w-full rounded-sm border px-3 ${errors.nickname ? 'border-danger' : 'border-border-hi'} focus:border-brand focus:outline-none`}
            {...register('nickname')}
          />
          {errors.nickname?.message && (
            <p
              id="signup-nickname-error"
              role="alert"
              className="text-mono-meta text-danger mt-1 font-mono"
            >
              {errors.nickname.message}
            </p>
          )}
        </div>

        <div>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            aria-label="비밀번호"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'signup-password-error' : undefined}
            placeholder="비밀번호"
            className={`bg-bg text-body text-text h-10 w-full rounded-sm border px-3 ${errors.password ? 'border-danger' : 'border-border-hi'} focus:border-brand focus:outline-none`}
            {...register('password')}
          />
          {errors.password?.message && (
            <p
              id="signup-password-error"
              role="alert"
              className="text-mono-meta text-danger mt-1 font-mono"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <input
            id="signup-password-confirm"
            type="password"
            autoComplete="new-password"
            aria-label="비밀번호 확인"
            aria-invalid={errors.passwordConfirm ? true : undefined}
            aria-describedby={errors.passwordConfirm ? 'signup-password-confirm-error' : undefined}
            placeholder="비밀번호 확인"
            className={`bg-bg text-body text-text h-10 w-full rounded-sm border px-3 ${errors.passwordConfirm ? 'border-danger' : 'border-border-hi'} focus:border-brand focus:outline-none`}
            {...register('passwordConfirm')}
          />
          {errors.passwordConfirm?.message && (
            <p
              id="signup-password-confirm-error"
              role="alert"
              className="text-mono-meta text-danger mt-1 font-mono"
            >
              {errors.passwordConfirm.message}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? '가입 중...' : '회원가입'}
        </Button>

        <Link to="/login" className="text-body-sm text-text-2 hover:text-text text-center">
          이미 계정이 있으신가요? 로그인
        </Link>
      </div>
    </form>
  );
}
