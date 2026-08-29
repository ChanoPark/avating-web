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

// 좌측 3px 레일(톤 시그널) — 색은 정의된 시맨틱 토큰으로만 준다.
const variantRail: Record<ToastVariant, string> = {
  info: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  error: 'border-l-danger',
};

// 배지는 wash 배경만 쓴다 — 틴트 채움에 같은 색 테두리를 겹치지 않는다.
const variantBadge: Record<ToastVariant, string> = {
  info: 'bg-primary-wash text-primary-press',
  success: 'bg-success-wash text-success',
  warning: 'bg-warning-wash text-warning',
  error: 'bg-danger-wash text-danger',
};

const variantIcon: Record<ToastVariant, LucideIcon> = {
  info: Info,
  success: Check,
  warning: CircleAlert,
  error: X,
};

const MAX_VISIBLE = 3;

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
        'shadow-3 bg-surface border-hairline pointer-events-auto w-85 rounded-md border border-l-[3px] px-3.5 py-3',
        variantRail[toast.variant]
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
            variantBadge[toast.variant]
          )}
        >
          <Icon size={12} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <div className="text-caption text-ink font-medium">{toast.title}</div>
          {toast.description !== undefined && (
            <div className="text-caption text-ink-secondary mt-0.5">{toast.description}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onDismiss(toast.id);
          }}
          aria-label="알림 닫기"
          className="text-ink-mute hover:text-ink cursor-pointer transition-colors"
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
