import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleAlert, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastVariant,
} from './toastContext';

type MarkedVariant = Exclude<ToastVariant, 'error'>;

const variantMark: Record<MarkedVariant, string> = {
  info: 'text-secondary',
  success: 'text-secondary',
  warning: 'text-secondary',
};

const variantIcon: Record<MarkedVariant, LucideIcon> = {
  info: Info,
  success: Check,
  warning: CircleAlert,
};

const MAX_VISIBLE = 3;

function dropOverflow(toasts: Toast[]): Toast[] {
  const nonError = toasts.filter((t) => t.variant !== 'error');
  const overflow = nonError.length - MAX_VISIBLE;
  if (overflow <= 0) return toasts;
  const droppedIds = new Set(nonError.slice(0, overflow).map((t) => t.id));
  return toasts.filter((t) => !droppedIds.has(t.id));
}

// 에러·경고 토스트는 자동으로 사라지지 않는다(S-11-07) — 놓치면 사용자가 실패를 알 방법이
// 없다. 성공은 3초 유지한다. 호출부가 durationMs 를 명시하면 그 값이 우선한다.
const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  info: 3000,
  success: 3000,
  warning: 0,
  error: 0,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const ms = toast.durationMs ?? DEFAULT_DURATION_MS[toast.variant];
    if (ms <= 0 || paused) return;
    const handle = setTimeout(() => {
      onDismiss(toast.id);
    }, ms);
    return () => {
      clearTimeout(handle);
    };
  }, [toast, onDismiss, paused]);

  const mark =
    toast.variant === 'error'
      ? null
      : { Icon: variantIcon[toast.variant], color: variantMark[toast.variant] };

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
      className={cn(
        'rounded-card pointer-events-auto w-full border px-3.5 py-3',
        toast.variant === 'error' ? 'bg-danger-tint border-danger-mark' : 'bg-canvas border-subtle',
        'animate-toast-in max-w-[var(--toast-w)]'
      )}
    >
      <div className="flex items-start gap-3">
        {/* 16px 마크는 블록이 아니라 제목의 첫 줄에 맞춘다 — (20 - 16) / 2. */}
        {mark && (
          <span className={cn('mt-0.5 shrink-0', mark.color)}>
            <mark.Icon size={16} strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {/* 제목은 14/600 — 토스트는 알림이지 섹션 제목이 아니라서 15 면 작은 다이얼로그로 읽힌다. */}
          <div className="text-btn text-ink break-keep">{toast.title}</div>
          {/* 본문은 사용자가 읽는 문장이라 secondary 다 — muted 가 아니다. */}
          {toast.description !== undefined && (
            <div className="text-caption text-secondary mt-0.5 break-keep">{toast.description}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onDismiss(toast.id);
          }}
          aria-label="알림 닫기"
          className="text-muted hover:text-primary mt-0.75 shrink-0 cursor-pointer transition-colors"
        >
          <X size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((toast: Omit<Toast, 'id'>) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `toast-${Date.now().toString()}-${Math.random().toString(36).slice(2)}`;
    setToasts((current) => dropOverflow([...current, { ...toast, id }]));
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed top-6 left-1/2 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-2"
            style={{ zIndex: 'var(--z-toast)' }}
          >
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
