import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@shared/lib/cn';

type InputProps = {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  trailingSlot?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'children'>;

// forms.css `.av-input` — 흰 서피스가 기본이고, 회색 채움은 disabled 상태에만 쓴다.
const base = cn(
  'bg-surface text-ink text-body w-full rounded-sm border px-3 py-2.25 leading-[1.4]',
  'min-h-10 placeholder:text-ink-mute',
  'transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-brand',
  'outline-none',
  'disabled:bg-canvas-soft disabled:text-ink-mute disabled:cursor-not-allowed'
);

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, errorMessage, trailingSlot, className, id, ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const helpId = helperText ? `${inputId}-help` : undefined;
  const errId = errorMessage ? `${inputId}-err` : undefined;
  const isError = Boolean(errorMessage);

  return (
    <div className="flex flex-col gap-1.5">
      {label !== undefined && (
        <label htmlFor={inputId} className="text-caption text-ink-secondary font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={isError || undefined}
          aria-describedby={errId ?? helpId}
          className={cn(
            base,
            isError
              ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--danger-wash)]'
              : 'border-hairline-input focus:border-primary focus:shadow-focus',
            trailingSlot ? 'pr-10' : null,
            className
          )}
          {...rest}
        />
        {trailingSlot !== undefined && (
          <span className="text-ink-mute absolute inset-y-0 right-2 flex items-center">
            {trailingSlot}
          </span>
        )}
      </div>
      {isError ? (
        <p id={errId} className="text-caption text-danger flex items-center gap-1.25">
          {/* 문자 글리프(✕) 대신 라인 아이콘 — Pretendard 에 없는 글자는 시스템 폰트로 폴백한다. */}
          <CircleAlert size={12} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
          {errorMessage}
        </p>
      ) : helperText !== undefined ? (
        <p id={helpId} className="text-caption text-ink-mute">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
