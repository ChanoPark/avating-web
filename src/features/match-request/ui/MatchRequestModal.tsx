import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPortal } from 'react-dom';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { Tag } from '@shared/ui/Tag';
import { useToast } from '@shared/ui/Toast/useToast';
import { isApiError } from '@shared/lib/errors';
import { cn } from '@shared/lib/cn';
import { useFocusTrap } from '@shared/lib/useFocusTrap';
import {
  MATCH_REQUEST_GREETING_HARD_LIMIT,
  MATCH_REQUEST_GREETING_MAX,
} from '@entities/match-request';
import { matchRequestFormSchema } from '../lib/formSchema';
import type { MatchRequestFormValues } from '../lib/formSchema';
import { useMyAvatars } from '@entities/avatar';
import { useSendMatchRequest } from '../api/useSendMatchRequest';
import { MyAvatarRadioGroup } from './MyAvatarRadioGroup';
import { PartnerAvatarCard, type PartnerAvatarSummary } from './PartnerAvatarCard';
import { InlineErrorPanel } from './InlineErrorPanel';

// 상태 안내 패널의 톤은 테두리가 아니라 텍스트 색으로만 표현한다.
const NOTICE_CLASS = 'text-caption border-subtle bg-canvas rounded-card border p-3';

type Props = {
  open: boolean;
  partnerAvatarId: string;
  partner: PartnerAvatarSummary;
  onClose: () => void;
  onSuccess?: () => void;
};

export function MatchRequestModal({ open, partnerAvatarId, partner, onClose, onSuccess }: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const requesterAvatarErrorId = useId();
  const greetingErrorId = useId();
  const greetingHelpId = useId();
  const inlineErrorId = useId();

  const { show: showToast } = useToast();
  const {
    data: myAvatarsData,
    isLoading: avatarsLoading,
    isError: avatarsError,
    refetch: refetchAvatars,
  } = useMyAvatars({ enabled: open });
  const { mutateAsync, isPending } = useSendMatchRequest();

  const myAvatars = myAvatarsData?.items ?? [];
  const firstSelectableId = myAvatars.find((a) => !a.busy)?.id ?? '';

  const [inlineError, setInlineError] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      const active = document.activeElement;
      triggerRef.current = active instanceof HTMLElement ? active : null;
      return;
    }
    const trigger = triggerRef.current;
    if (trigger !== null && document.body.contains(trigger)) {
      trigger.focus();
    }
  }, [open]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MatchRequestFormValues>({
    resolver: zodResolver(matchRequestFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { requesterAvatarId: '', greeting: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (firstSelectableId !== '' && getValues('requesterAvatarId') === '') {
      setValue('requesterAvatarId', firstSelectableId, { shouldValidate: false });
    }
  }, [open, firstSelectableId, setValue, getValues]);

  useEffect(() => {
    if (!open) {
      reset();
      setInlineError(false);
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, isPending]);

  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    if (avatarsLoading) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const firstRadio = dialog.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)');
    if (firstRadio !== null) {
      firstRadio.focus();
      return;
    }
    dialog.focus();
  }, [open, avatarsLoading, avatarsError]);

  if (!open) return null;

  const greetingValue = watch('greeting') ?? '';
  const greetingLength = greetingValue.length;
  const requesterAvatarId = watch('requesterAvatarId');

  const hasNoAvatars = !avatarsLoading && !avatarsError && myAvatars.length === 0;
  const allBusy =
    !avatarsLoading && !avatarsError && myAvatars.length > 0 && myAvatars.every((a) => a.busy);
  const isGreetingOverLimit = greetingLength > MATCH_REQUEST_GREETING_MAX;
  const isLoading = isSubmitting || isPending;
  const submitDisabled =
    isLoading || avatarsLoading || avatarsError || hasNoAvatars || allBusy || isGreetingOverLimit;

  const onSubmit = async (values: MatchRequestFormValues) => {
    setInlineError(false);
    try {
      await mutateAsync({
        partnerAvatarId,
        requesterAvatarId: values.requesterAvatarId,
        greeting: values.greeting,
      });
      showToast({ variant: 'success', title: '요청을 보냈어요' });
      onSuccess?.();
      onClose();
    } catch (err) {
      if (isApiError(err)) {
        if (err.statusCode === 409 && err.code === 'PARTNER_BLOCKED') {
          showToast({ variant: 'error', title: '이 사용자에게는 요청을 보낼 수 없어요' });
          onClose();
          return;
        }
        if (err.statusCode === 409 && err.code === 'DUPLICATE_REQUEST') {
          showToast({ variant: 'error', title: '이미 응답 대기 중인 요청이 있어요' });
          onClose();
          return;
        }
        if (err.statusCode === 404 && err.code === 'AVATAR_NOT_FOUND') {
          showToast({ variant: 'error', title: '아바타를 찾을 수 없어요' });
          onClose();
          return;
        }
        if (err.statusCode === 410 && err.code === 'REQUEST_EXPIRED') {
          showToast({ variant: 'error', title: '요청이 만료됐어요' });
          onClose();
          return;
        }
      }
      setInlineError(true);
      showToast({ variant: 'error', title: '잠시 후 다시 시도해주세요' });
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 'var(--z-modal)' }}
    >
      <button
        type="button"
        aria-label="모달 닫기"
        onClick={() => {
          if (!isPending) onClose();
        }}
        className="bg-overlay absolute inset-0 cursor-default backdrop-blur-sm"
        style={{ zIndex: 'var(--z-modal-bg)' }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="border-subtle bg-canvas rounded-card relative w-full max-w-140 overflow-hidden border"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        <div className="flex items-start justify-between gap-2 px-6 pt-4.5">
          <Tag>MATCH REQUEST</Tag>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => {
              if (!isPending) onClose();
            }}
            className="text-muted hover:text-primary -mr-1 inline-flex shrink-0 cursor-pointer items-center transition-colors"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 px-6 pt-3.5">
          <h2 id={titleId} className="text-lead text-primary">
            이 아바타에게 소개팅을 요청할까요?
          </h2>
          <p id={descriptionId} className="text-caption text-secondary">
            요청을 받은 사용자가 수락하면 두 아바타가 대화를 시작해요.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          noValidate
        >
          <div className="flex flex-col gap-3 px-6 py-4.5">
            <PartnerAvatarCard partner={partner} />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption text-secondary font-medium">
                  요청에 사용할 내 아바타
                </span>
                <span className="text-meta text-secondary">1개 선택</span>
              </div>
              {avatarsLoading ? (
                <p role="status" aria-live="polite" className="text-caption text-secondary">
                  아바타 목록 불러오는 중…
                </p>
              ) : avatarsError ? (
                <div role="alert" className={cn(NOTICE_CLASS, 'text-danger flex flex-col gap-2')}>
                  <span>아바타 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</span>
                  <button
                    type="button"
                    onClick={() => {
                      void refetchAvatars();
                    }}
                    className="text-meta text-action hover:text-action-hover cursor-pointer self-start font-medium"
                  >
                    다시 시도
                  </button>
                </div>
              ) : hasNoAvatars ? (
                <p role="status" aria-live="polite" className={cn(NOTICE_CLASS, 'text-warning')}>
                  아바타를 먼저 만들어주세요. 매칭 요청에는 최소 1개의 아바타가 필요해요.
                </p>
              ) : allBusy ? (
                <p role="status" aria-live="polite" className={cn(NOTICE_CLASS, 'text-warning')}>
                  현재 매칭에 사용할 수 있는 아바타가 없어요. 매칭 중인 아바타가 끝나면 다시
                  시도해주세요.
                </p>
              ) : (
                <>
                  <input type="hidden" {...register('requesterAvatarId')} />
                  <MyAvatarRadioGroup
                    avatars={myAvatars}
                    value={requesterAvatarId}
                    onChange={(next) => {
                      setValue('requesterAvatarId', next, { shouldValidate: true });
                    }}
                    aria-invalid={errors.requesterAvatarId !== undefined ? true : undefined}
                    aria-describedby={
                      errors.requesterAvatarId !== undefined ? requesterAvatarErrorId : undefined
                    }
                  />
                  {errors.requesterAvatarId?.message && (
                    <p id={requesterAvatarErrorId} role="alert" className="text-meta text-danger">
                      {errors.requesterAvatarId.message}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="match-request-greeting"
                  className="text-caption text-secondary font-medium"
                >
                  아바타가 건넬 첫 인사
                </label>
                <span
                  className={cn(
                    'text-meta tnum',
                    isGreetingOverLimit ? 'text-danger' : 'text-secondary'
                  )}
                >
                  {greetingLength} / {MATCH_REQUEST_GREETING_MAX}
                </span>
              </div>
              <textarea
                id="match-request-greeting"
                rows={3}
                maxLength={MATCH_REQUEST_GREETING_HARD_LIMIT}
                aria-invalid={errors.greeting !== undefined ? true : undefined}
                aria-describedby={errors.greeting !== undefined ? greetingErrorId : greetingHelpId}
                {...register('greeting')}
                className={cn(
                  'bg-canvas text-body text-primary rounded-chip min-h-23 w-full resize-y border px-3 py-2.25 leading-[1.55]',
                  'ease-standard transition-[border-color,box-shadow] duration-[var(--dur-fast)]',
                  errors.greeting ? 'border-danger-mark' : 'border-field',
                  'focus:border-mark'
                )}
              />
              {errors.greeting?.message ? (
                <p id={greetingErrorId} role="alert" className="text-meta text-danger">
                  {errors.greeting.message}
                </p>
              ) : (
                <p id={greetingHelpId} className="text-meta text-secondary">
                  비워 두면 아바타가 알아서 인사를 시작합니다
                </p>
              )}
            </div>

            {inlineError && (
              <InlineErrorPanel
                id={inlineErrorId}
                retryDisabled={isLoading}
                onRetry={() => {
                  void handleSubmit(onSubmit)();
                }}
              />
            )}
          </div>

          <div className="border-subtle flex items-center justify-between gap-2 border-t px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              disabled={isLoading}
              onClick={() => {
                if (!isPending) onClose();
              }}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitDisabled}
              aria-busy={isLoading}
              aria-describedby={[
                errors.requesterAvatarId ? requesterAvatarErrorId : null,
                errors.greeting ? greetingErrorId : null,
                inlineError ? inlineErrorId : null,
              ]
                .filter((id): id is string => id !== null)
                .join(' ')}
            >
              {isLoading ? '요청 보내는 중…' : '요청 보내기'}
              {!isLoading && <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />}
            </Button>
          </div>
        </form>

        <p className="text-meta text-secondary px-6 pb-4 text-center">
          24시간 안에 응답이 없으면 요청은 자동으로 만료돼요.
        </p>
      </div>
    </div>,
    document.body
  );
}
