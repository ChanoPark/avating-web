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

// 어떤 다이얼로그인지는 글리프가 말한다 — 틴트가 붙는 건 파괴적 액션 하나뿐이다.
const TONE_CONFIG: Record<Exclude<ModalTone, 'neutral'>, { badge: string; icon: LucideIcon }> = {
  info: { badge: 'bg-raised text-secondary', icon: Info },
  success: { badge: 'bg-raised text-secondary', icon: Check },
  warning: { badge: 'bg-raised text-secondary', icon: CircleAlert },
  danger: { badge: 'bg-danger-tint text-danger', icon: X },
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
      className="fixed inset-0 flex items-center justify-center sm:px-6"
      style={{ zIndex: 'var(--z-modal)' }}
    >
      <button
        type="button"
        aria-label="모달 닫기"
        tabIndex={-1}
        onClick={onClose}
        className="bg-overlay absolute inset-0 cursor-default"
        style={{ zIndex: 'var(--z-modal-bg)' }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="bg-canvas border-subtle relative flex h-full max-h-full w-full max-w-none flex-col overflow-hidden border-0 sm:h-auto sm:max-w-140 sm:rounded-[16px] sm:border"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="flex items-center gap-2">
            {toneCfg && ToneIcon && (
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex h-5.5 items-center justify-center rounded-full border border-transparent px-2.25',
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
            className="text-muted hover:text-primary -mr-1 inline-flex shrink-0 cursor-pointer items-center transition-colors"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className={cn('flex flex-col gap-2 px-5 pt-3', children === undefined && 'pb-5')}>
          <h2 className="text-title text-ink font-bold">{title}</h2>
          {description !== undefined && <p className="text-body text-primary">{description}</p>}
        </div>

        {children !== undefined && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-5 py-4">
            {children}
          </div>
        )}

        {footer !== undefined && (
          <div className="border-subtle flex items-center justify-between gap-2 border-t px-5 py-3">
            {footer}
          </div>
        )}

        {footnote !== undefined && (
          <p className="text-meta text-secondary px-6 pb-4 text-center">{footnote}</p>
        )}
      </div>
    </div>,
    document.body
  );
}
