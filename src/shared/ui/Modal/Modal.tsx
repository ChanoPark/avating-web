import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Check, CircleAlert, Info, X } from 'lucide-react';
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
  footnote?: ReactNode;
  tone?: ModalTone;
};

const TONE_CONFIG: Record<Exclude<ModalTone, 'neutral'>, { badge: string; icon: LucideIcon }> = {
  info: { badge: 'bg-primary-wash text-primary-press', icon: Info },
  success: { badge: 'bg-success-wash text-success', icon: Check },
  warning: { badge: 'bg-warning-wash text-warning', icon: CircleAlert },
  danger: { badge: 'bg-danger-wash text-danger', icon: X },
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  footnote,
  tone = 'neutral',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

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
    // 열림 직전 포커스를 저장했다가 닫힐 때 트리거로 되돌린다(키보드 a11y §5.1 item 4).
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
        className="border-hairline bg-surface shadow-float relative w-full max-w-140 overflow-hidden rounded-xl border"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        <div className="flex items-start justify-between gap-2 px-6 pt-4.5">
          <div className="flex items-center gap-2">
            {toneCfg && ToneIcon && (
              <span
                aria-hidden="true"
                className={cn(
                  'rounded-pill inline-flex h-5.5 items-center justify-center border border-transparent px-2.25',
                  toneCfg.badge
                )}
              >
                <ToneIcon size={12} strokeWidth={1.5} />
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="text-ink-faint hover:text-ink -mr-1 inline-flex shrink-0 cursor-pointer items-center transition-colors"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div
          className={cn('flex flex-col gap-1.5 px-6 pt-3.5', children === undefined && 'pb-4.5')}
        >
          <h2 className="text-heading-md text-ink">{title}</h2>
          {description !== undefined && <p className="text-body-sm text-ink-mute">{description}</p>}
        </div>

        {children !== undefined && (
          <div className="flex flex-col gap-3 px-6 py-4.5">{children}</div>
        )}

        {footer !== undefined && (
          <div className="border-hairline flex items-center justify-between gap-2 border-t px-6 py-4">
            {footer}
          </div>
        )}

        {footnote !== undefined && (
          <p className="text-micro text-ink-mute px-6 pb-4 text-center">{footnote}</p>
        )}
      </div>
    </div>,
    document.body
  );
}
