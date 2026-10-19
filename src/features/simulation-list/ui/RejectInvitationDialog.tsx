import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@shared/ui/Button';
import { TEXTAREA_CLASS } from '@shared/ui/Input';
import { useFocusTrap } from '@shared/lib/useFocusTrap';
import { DEFAULT_REJECT_MESSAGE, REJECT_MESSAGE_MAX } from '@entities/match-request';

type RejectInvitationDialogProps = {
  partnerName: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (rejectMessage: string) => void;
};

export function RejectInvitationDialog({
  partnerName,
  pending,
  onClose,
  onSubmit,
}: RejectInvitationDialogProps) {
  const titleId = useId();
  const reasonId = useId();
  const helpId = useId();
  const [reason, setReason] = useState('');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const active = document.activeElement;
    const trigger = active instanceof HTMLElement ? active : null;
    reasonRef.current?.focus();
    return () => {
      if (trigger !== null && document.body.contains(trigger)) trigger.focus();
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, pending]);

  useFocusTrap(true, dialogRef);

  const close = () => {
    if (!pending) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center sm:px-6"
      style={{ zIndex: 'var(--z-modal)' }}
    >
      <button
        type="button"
        aria-label="창 닫기"
        tabIndex={-1}
        onClick={close}
        className="bg-overlay animate-scrim-in absolute inset-0 cursor-default"
        style={{ zIndex: 'var(--z-modal-bg)' }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-canvas border-subtle animate-modal-in sm:rounded-card relative flex h-full w-full max-w-none flex-col border-0 sm:h-auto sm:max-w-100 sm:border"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending) onSubmit(reason);
          }}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="px-5 pt-5 pb-3">
            <h2 id={titleId} className="text-title text-ink font-bold">
              {partnerName}의 요청을 거절할까요?
            </h2>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 pb-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={reasonId} className="text-caption text-secondary font-medium">
                  거절 사유 (선택)
                </label>
                <span className="text-meta text-secondary tnum">
                  {reason.length} / {REJECT_MESSAGE_MAX}
                </span>
              </div>
              <textarea
                ref={reasonRef}
                id={reasonId}
                rows={3}
                maxLength={REJECT_MESSAGE_MAX}
                value={reason}
                aria-describedby={helpId}
                onChange={(event) => {
                  setReason(event.target.value);
                }}
                className={TEXTAREA_CLASS}
              />
              <p id={helpId} className="text-meta text-secondary">
                비워 두면 기본 문구로 전해요 — “{DEFAULT_REJECT_MESSAGE}”
              </p>
            </div>
          </div>
          <div className="border-subtle flex items-center justify-end gap-2 border-t px-5 py-3">
            <Button type="button" variant="ghost" disabled={pending} onClick={close}>
              돌아가기
            </Button>
            <Button type="submit" variant="dangerSolid" disabled={pending} aria-busy={pending}>
              거절하기
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
