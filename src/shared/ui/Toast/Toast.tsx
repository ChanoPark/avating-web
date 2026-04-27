import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@shared/lib/cn';
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastVariant,
} from './toastContext';

const variantClass: Record<ToastVariant, string> = {
  info: 'border-brand-border bg-brand-soft text-text',
  success: 'border-[rgba(63,185,80,0.3)] bg-[rgba(63,185,80,0.1)] text-text',
  warning: 'border-[rgba(210,153,34,0.3)] bg-[rgba(210,153,34,0.1)] text-text',
  error: 'border-[rgba(248,81,73,0.3)] bg-[rgba(248,81,73,0.1)] text-text',
};

const variantBadge: Record<ToastVariant, string> = {
  info: 'text-brand',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const ms = toast.durationMs ?? 4000;
    if (ms <= 0) return;
    const handle = setTimeout(() => {
      onDismiss(toast.id);
    }, ms);
    return () => {
      clearTimeout(handle);
    };
  }, [toast, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'shadow-2 pointer-events-auto w-[320px] rounded-md border p-4 backdrop-blur',
        variantClass[toast.variant]
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('text-mono-meta font-mono uppercase', variantBadge[toast.variant])}>
          {toast.variant}
        </span>
        <div className="flex-1">
          <div className="font-ui text-subheading text-text">{toast.title}</div>
          {toast.description !== undefined && (
            <div className="text-body-sm text-text-2 mt-1">{toast.description}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onDismiss(toast.id);
          }}
          aria-label="알림 닫기"
          className="text-text-3 hover:text-text transition-colors"
        >
          ✕
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
    setToasts((current) => [...current, { ...toast, id }]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed right-6 bottom-6 flex flex-col gap-3"
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
