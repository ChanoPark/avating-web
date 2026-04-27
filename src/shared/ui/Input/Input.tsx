import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

type InputProps = {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  trailingSlot?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'children'>;

const base =
  'h-10 w-full rounded-sm bg-bg px-3 text-body text-text placeholder:text-text-3 ' +
  'transition-colors duration-[var(--duration-fast)] ease-[var(--ease)] ' +
  'border focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-bg-elev-2';

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
    <div className="flex flex-col gap-2">
      {label !== undefined && (
        <label htmlFor={inputId} className="font-ui text-ui text-text">
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
            isError ? 'border-danger focus:border-danger' : 'border-border-hi focus:border-brand',
            trailingSlot ? 'pr-10' : null,
            className
          )}
          {...rest}
        />
        {trailingSlot !== undefined && (
          <span className="text-text-3 absolute inset-y-0 right-2 flex items-center">
            {trailingSlot}
          </span>
        )}
      </div>
      {isError ? (
        <p id={errId} className="text-mono-meta text-danger font-mono">
          ✕ {errorMessage}
        </p>
      ) : helperText !== undefined ? (
        <p id={helpId} className="text-mono-meta text-text-3 font-mono">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
