import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastVariant,
} from './toastContext';

// 좌측 3px 레일(톤 시그널) — Avating Modal Toast System 정본.
const variantRail: Record<ToastVariant, string> = {
  info: 'border-l-brand',
  success: 'border-l-success',
  warning: 'border-l-warning',
  error: 'border-l-danger',
};

// 시맨틱 글리프 배지 (20px 원형, semantic-soft 채움 + semantic 보더).
const variantBadge: Record<ToastVariant, string> = {
  info: 'bg-brand-soft border-brand-border text-brand',
  success: 'border-[rgba(63,185,80,0.35)] bg-[rgba(63,185,80,0.1)] text-success',
  warning: 'border-[rgba(210,153,34,0.35)] bg-[rgba(210,153,34,0.1)] text-warning',
  error: 'border-[rgba(248,81,73,0.35)] bg-[rgba(248,81,73,0.1)] text-danger',
};

const variantIcon: Record<ToastVariant, LucideIcon> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: X,
};

const MAX_VISIBLE = 3;
const DEFAULT_DURATION_MS = 3000;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  // hover 시 카운트다운 일시정지 (마우스를 떼면 재시작).
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const ms = toast.durationMs ?? DEFAULT_DURATION_MS;
    if (ms <= 0 || paused) return;
    const handle = setTimeout(() => {
      onDismiss(toast.id);
    }, ms);
    return () => {
      clearTimeout(handle);
    };
  }, [toast, onDismiss, paused]);

  const Icon = variantIcon[toast.variant];

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
        'shadow-3 bg-bg-elev-1 border-border pointer-events-auto w-[340px] rounded-[10px] border border-l-[3px] px-3.5 py-3',
        variantRail[toast.variant]
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
            variantBadge[toast.variant]
          )}
        >
          <Icon size={12} strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <div className="font-ui text-ui text-text">{toast.title}</div>
          {toast.description !== undefined && (
            <div className="text-body-sm text-text-2 mt-0.5">{toast.description}</div>
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
    // 최대 3개만 노출 — 4번째부터는 가장 오래된 토스트를 자동 제거.
    setToasts((current) => [...current, { ...toast, id }].slice(-MAX_VISIBLE));
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
