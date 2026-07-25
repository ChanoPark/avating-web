import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { useFocusTrap } from '@shared/lib/useFocusTrap';

type ModalTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 시맨틱 톤 — 비-neutral 은 상단 2px 액센트 레일 + 헤더 글리프 배지를 표시 (Modal Toast System 정본). */
  tone?: ModalTone;
  labelledById?: string;
};

const sizes: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-[360px]',
  md: 'max-w-[420px]',
  lg: 'max-w-[480px]',
  xl: 'max-w-[560px]',
};

const TONE_CONFIG: Record<
  Exclude<ModalTone, 'neutral'>,
  { rail: string; badge: string; icon: LucideIcon }
> = {
  info: {
    rail: 'border-t-brand',
    badge: 'bg-brand-soft border-brand-border text-brand',
    icon: Info,
  },
  success: {
    rail: 'border-t-success',
    badge: 'border-[rgba(63,185,80,0.35)] bg-[rgba(63,185,80,0.1)] text-success',
    icon: Check,
  },
  warning: {
    rail: 'border-t-warning',
    badge: 'border-[rgba(210,153,34,0.35)] bg-[rgba(210,153,34,0.1)] text-warning',
    icon: AlertTriangle,
  },
  danger: {
    rail: 'border-t-danger',
    badge: 'border-[rgba(248,81,73,0.35)] bg-[rgba(248,81,73,0.1)] text-danger',
    icon: X,
  },
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  tone = 'neutral',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // Tab/Shift+Tab 을 다이얼로그 내부로 순환 가두기 (키보드 a11y § 5.1 item 2·3).
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    // 열림 직전 포커스를 저장했다가 닫힐 때 트리거로 복귀 (키보드 a11y § 5.1 item 4).
    const active = document.activeElement;
    prevFocusRef.current = active instanceof HTMLElement ? active : null;
    dialogRef.current?.focus();
    return () => {
      prevFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const toneCfg = tone === 'neutral' ? null : TONE_CONFIG[tone];
  const ToneIcon = toneCfg?.icon;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 'var(--z-modal)' }}
    >
      <button
        type="button"
        aria-label="모달 닫기"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 'var(--z-modal-bg)' }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'border-border bg-bg-elev-1 shadow-3 relative w-full rounded-xl border p-6',
          toneCfg && `border-t-2 ${toneCfg.rail}`,
          sizes[size]
        )}
        style={{ zIndex: 'var(--z-modal)' }}
      >
        <div className="flex items-start gap-3">
          {toneCfg && ToneIcon && (
            <span
              aria-hidden="true"
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border',
                toneCfg.badge
              )}
            >
              <ToneIcon size={20} strokeWidth={1.5} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-ui text-heading text-text">{title}</h2>
            {description !== undefined && (
              <p className="text-body-sm text-text-2 mt-1">{description}</p>
            )}
          </div>
        </div>
        {children !== undefined && <div className="mt-4">{children}</div>}
        {footer !== undefined && (
          <div className="mt-6 flex items-center justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
