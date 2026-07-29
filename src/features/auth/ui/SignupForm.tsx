import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { useMemo, useState } from 'react';
import { ArrowRight, CircleAlert, Eye, EyeOff } from 'lucide-react';
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
  if (password.length === 0) return { score: 0, label: '' };
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
  0: 'bg-canvas-soft',
  1: 'bg-danger',
  2: 'bg-warning',
  3: 'bg-success',
  4: 'bg-success',
};

const STRENGTH_TEXT_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'text-ink-mute',
  1: 'text-danger',
  2: 'text-warning',
  3: 'text-success',
  4: 'text-success',
};

// 폼 입력 계약은 shared/ui/Input 의 base 와 같다 — caption(13px) · radius `--r-sm` ·
// padding 9px 12px · placeholder 는 `--ink-mute`(`--ink-faint` 금지).
// forms.css `.av-input` — 흰 서피스 + hairline-input 테두리 · 15px · padding 9px 12px
// · radius --r-sm(6) · min-height 40. 회색 채움은 disabled 전용이다.
const inputBase =
  'bg-surface text-body text-ink placeholder:text-ink-mute min-h-10 w-full rounded-sm border px-3 py-2.25 leading-[1.4] transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-brand focus:outline-none focus-visible:shadow-focus disabled:bg-canvas-soft disabled:text-ink-mute disabled:cursor-not-allowed';

// 아직 화면이 없는 보조 액션의 표기 — disabled 버튼 + 준비 중 aria-label (레포 공통 관례).
const oauthButton =
  'bg-surface border-hairline-input text-ink-secondary text-body-sm rounded-pill flex h-10 items-center justify-center border disabled:cursor-not-allowed disabled:opacity-70';

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
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values: SignupFormValues) => {
    // termsAgreed / marketingOptIn 은 서버 payload 비포함 — 와이어프레임 미명세 + 사용자 결정
    // (인수인계 plan §5.1). 클라이언트 측 폼 검증·로컬 기록 용도로만 사용.
    try {
      await mutateAsync({
        email: values.email,
        nickname: values.nickname,
        password: values.password,
      });
      // marketingOptIn 로컬 기록 — 추후 서버 동기 연결 시점에 읽어 payload 포함.
      try {
        localStorage.setItem('avating:marketing-opt-in', String(values.marketingOptIn));
      } catch {
        // 사파리 프라이빗 모드 등 localStorage 접근 실패 — 무시 (선택 항목이라 손실 허용).
      }
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

        {/* 필드 그룹 — 정본 Col gap 14, 순서는 이메일 → 비밀번호 → 닉네임 */}
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-2">
            <label htmlFor="signup-email" className="text-caption text-ink-secondary font-medium">
              이메일
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              className={`${inputBase} ${errors.email ? 'border-danger focus:border-danger' : 'border-hairline-input focus:border-primary'}`}
              {...register('email')}
            />
            {errors.email?.message && (
              <p
                id="signup-email-error"
                role="alert"
                className="text-micro text-danger flex items-center gap-1"
              >
                <CircleAlert size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="signup-password"
              className="text-caption text-ink-secondary font-medium"
            >
              비밀번호
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={
                  errors.password
                    ? 'signup-password-error'
                    : 'signup-password-help signup-password-strength'
                }
                placeholder="8자 이상, 영문·숫자·특수문자 포함"
                className={`${inputBase} pr-10 ${errors.password ? 'border-danger focus:border-danger' : 'border-hairline-input focus:border-primary'}`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => {
                  setShowPassword((v) => !v);
                }}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className="text-ink-mute hover:text-ink absolute inset-y-0 right-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                )}
              </button>
            </div>
            <div id="signup-password-strength" className="flex items-center gap-2">
              {/* 4단계 분절 막대 (signup.md §5 결정4) */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={strength.score}
                aria-label="비밀번호 강도"
                className="flex flex-1 gap-1"
              >
                {[1, 2, 3, 4].map((seg) => (
                  <span
                    key={seg}
                    className={`ease-brand h-1 flex-1 rounded-sm transition-colors duration-[var(--dur)] ${
                      seg <= strength.score ? STRENGTH_COLORS[strength.score] : 'bg-canvas-soft'
                    }`}
                  />
                ))}
              </div>
              <span
                aria-live="polite"
                className={`text-micro tnum ${STRENGTH_TEXT_COLORS[strength.score]}`}
              >
                {strength.label}
              </span>
            </div>
            {errors.password?.message ? (
              <p
                id="signup-password-error"
                role="alert"
                className="text-micro text-danger flex items-center gap-1"
              >
                <CircleAlert size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.password.message}
              </p>
            ) : (
              <p id="signup-password-help" className="text-micro text-ink-mute tnum">
                영문·숫자·특수문자를 섞어 8자 이상 입력해 주세요
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="signup-nickname"
              className="text-caption text-ink-secondary font-medium"
            >
              닉네임
            </label>
            <input
              id="signup-nickname"
              type="text"
              autoComplete="nickname"
              placeholder="아바타 프로필에 표시됩니다"
              aria-invalid={errors.nickname ? true : undefined}
              aria-describedby={errors.nickname ? 'signup-nickname-error' : 'signup-nickname-help'}
              className={`${inputBase} ${errors.nickname ? 'border-danger focus:border-danger' : 'border-hairline-input focus:border-primary'}`}
              {...register('nickname')}
            />
            {errors.nickname?.message ? (
              <p
                id="signup-nickname-error"
                role="alert"
                className="text-micro text-danger flex items-center gap-1"
              >
                <CircleAlert size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.nickname.message}
              </p>
            ) : (
              <p id="signup-nickname-help" className="text-micro text-ink-mute tnum">
                영문, 숫자, 한글 · 2–12자
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-caption text-ink-secondary flex items-center gap-2">
              <input
                id="signup-terms"
                type="checkbox"
                aria-invalid={errors.termsAgreed ? true : undefined}
                aria-describedby={errors.termsAgreed ? 'signup-terms-error' : undefined}
                className={`accent-primary h-4 w-4 shrink-0 rounded-sm border ${errors.termsAgreed ? 'border-danger outline-danger outline outline-1' : 'border-hairline-input'}`}
                {...register('termsAgreed')}
              />
              <label htmlFor="signup-terms" className="tnum">
                만 15세 이상이며 이용약관 및 개인정보 처리방침에 동의합니다{' '}
                <span className="text-danger">*</span>
              </label>
            </div>
            {errors.termsAgreed?.message && (
              <p
                id="signup-terms-error"
                role="alert"
                className="text-micro text-danger ml-6 flex items-center gap-1"
              >
                <CircleAlert size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.termsAgreed.message}
              </p>
            )}
            <div className="text-caption text-ink-secondary flex items-center gap-2">
              <input
                id="signup-marketing"
                type="checkbox"
                className="border-hairline-input accent-primary h-4 w-4 shrink-0 rounded-sm border"
                {...register('marketingOptIn')}
              />
              <label htmlFor="signup-marketing">알림 수신 (선택)</label>
            </div>
          </div>
        </div>

        <Button type="submit" variant="primary" block disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? '가입 중...' : '계정 만들기'}
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>

        <div className="text-caption flex items-center justify-center gap-1.5">
          <span className="text-ink-mute">이미 계정이 있나요?</span>
          <Link to="/login" className="text-primary hover:text-primary-hover font-medium">
            로그인
          </Link>
        </div>
      </div>
    </form>
  );
}
