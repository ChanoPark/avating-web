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

// `.cx-input` — 필드는 상자가 아니라 톤이다: 회색 채움에 테두리가 없다.
// 포커스는 링 하나뿐이고 offset 0 이라 필드 가장자리에 딱 붙는다 (전역은 offset 2).
// placeholder 는 사용자가 읽는 문장이라 secondary(5.73:1)다 — muted(3.94:1)가 아니다.
/** 오류 표시는 1px 안쪽 선이다 — 필드에 테두리가 없어서 border-color 는 아무 효과가 없다. */
export const FIELD_ERROR_CLASS = 'shadow-[inset_0_0_0_1px_var(--danger-text)]';

export const FIELD_CLASS = cn(
  'bg-surface text-primary text-body w-full rounded-chip border-0 px-3',
  'h-9 placeholder:text-secondary',
  'transition-[background-color,box-shadow] duration-[var(--dur-fast)] ease-standard',
  'hover:bg-raised focus-visible:outline-offset-0',
  'disabled:bg-field-disabled disabled:text-disabled disabled:cursor-not-allowed'
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
    <div className="flex flex-col gap-1">
      {label !== undefined && (
        <label htmlFor={inputId} className="text-caption text-secondary font-medium">
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
            FIELD_CLASS,
            // 오류는 1px 안쪽 선이다 — 링을 두 겹으로 얹지 않는다.
            isError ? FIELD_ERROR_CLASS : null,
            trailingSlot ? 'pr-10' : null,
            className
          )}
          {...rest}
        />
        {trailingSlot !== undefined && (
          <span className="text-secondary absolute inset-y-0 right-2 flex items-center">
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
        <p id={helpId} className="text-caption text-secondary">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
