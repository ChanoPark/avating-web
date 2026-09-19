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

// 높이는 한 줄 필드와 textarea 가 다르다 — cn 은 클래스를 병합하지 않아 h-9 위에 h-auto 를
// 얹으면 둘이 다투므로 높이를 뺀 공통 톤만 여기 둔다.
const FIELD_TONE_CLASS = cn(
  'bg-surface text-primary text-body w-full rounded-chip border-0',
  'placeholder:text-secondary',
  'transition-[background-color,box-shadow] duration-[var(--dur-fast)] ease-standard',
  'hover:bg-raised focus-visible:outline-offset-0 focus-visible:shadow-none',
  'disabled:bg-field-disabled disabled:text-disabled disabled:cursor-not-allowed'
);

export const FIELD_CLASS = cn(FIELD_TONE_CLASS, 'h-9 px-3');

/** `.cx-input--textarea` — 높이 auto · 최소 88px · 사방 12px 패딩 · 세로 리사이즈. */
export const TEXTAREA_CLASS = cn(FIELD_TONE_CLASS, 'h-auto min-h-22 resize-y p-3');

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
