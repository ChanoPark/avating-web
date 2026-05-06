import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPortal } from 'react-dom';
import { Button } from '@shared/ui/Button';
import { Tag } from '@shared/ui/Tag';
import { useToast } from '@shared/ui/Toast/useToast';
import { isApiError } from '@shared/lib/errors';
import { cn } from '@shared/lib/cn';
import { matchRequestFormSchema } from '../lib/formSchema';
import type { MatchRequestFormValues } from '../lib/formSchema';
import { useMyAvatars } from '../api/useMyAvatars';
import { useSendMatchRequest } from '../api/useSendMatchRequest';
import { MyAvatarRadioGroup } from './MyAvatarRadioGroup';
import { PartnerAvatarCard, type PartnerAvatarSummary } from './PartnerAvatarCard';

const REQUEST_COST_GEMS = 30;
const GREETING_MAX = 100;

type Props = {
  open: boolean;
  partnerAvatarId: string;
  partner: PartnerAvatarSummary;
  onClose: () => void;
  onSuccess?: () => void;
};

export function MatchRequestModal({ open, partnerAvatarId, partner, onClose, onSuccess }: Props) {
  const titleId = useId();
  const greetingErrorId = useId();
  const radioErrorId = useId();
  const costNoteId = useId();

  const { show: showToast } = useToast();
  const { data: myAvatarsData, isLoading: avatarsLoading } = useMyAvatars();
  const { mutateAsync, isPending } = useSendMatchRequest();

  const myAvatars = myAvatarsData?.items ?? [];
  const firstSelectableId = myAvatars.find((a) => !a.busy)?.id ?? '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MatchRequestFormValues>({
    resolver: zodResolver(matchRequestFormSchema),
    mode: 'onTouched',
    defaultValues: { requesterAvatarId: '', greeting: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (firstSelectableId !== '' && watch('requesterAvatarId') === '') {
      setValue('requesterAvatarId', firstSelectableId, { shouldValidate: false });
    }
  }, [open, firstSelectableId, setValue, watch]);

  useEffect(() => {
    if (!open) reset({ requesterAvatarId: '', greeting: '' });
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

  if (!open) return null;

  const greetingValue = watch('greeting') ?? '';
  const greetingLength = greetingValue.length;
  const requesterAvatarId = watch('requesterAvatarId');

  const noSelectableAvatars = !avatarsLoading && myAvatars.every((a) => a.busy);
  const isLoading = isSubmitting || isPending;

  const onSubmit = async (values: MatchRequestFormValues) => {
    const greeting = (values.greeting ?? '').trim();
    try {
      await mutateAsync({
        partnerAvatarId,
        requesterAvatarId: values.requesterAvatarId,
        greeting: greeting === '' ? undefined : greeting,
      });
      showToast({ variant: 'success', title: '요청을 보냈어요' });
      onSuccess?.();
      onClose();
    } catch (err) {
      if (isApiError(err)) {
        if (err.statusCode === 402 && err.code === 'INSUFFICIENT_GEMS') {
          showToast({ variant: 'error', title: '다이아가 부족해요' });
          return;
        }
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
      }
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
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 'var(--z-modal-bg)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="border-border bg-bg-elev-1 shadow-2 relative flex w-full max-w-[440px] flex-col gap-4 rounded-xl border p-6"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        <div className="flex items-center justify-between">
          <Tag variant="brand">매칭 요청</Tag>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => {
              if (!isPending) onClose();
            }}
            className="text-text-3 hover:text-text text-body-sm"
          >
            ✕
          </button>
        </div>

        <div>
          <h2 id={titleId} className="font-ui text-heading text-text">
            이 아바타에게 소개팅을 요청합니다
          </h2>
          <p className="text-body-sm text-text-2 mt-1">
            요청을 받은 사용자가 수락하면 두 아바타가 채팅을 시작해요
          </p>
        </div>

        <PartnerAvatarCard partner={partner} />

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-mono-meta text-text-2 font-mono uppercase">
                요청에 사용할 내 아바타
              </span>
              <span className="text-mono-meta text-text-3 font-mono uppercase">1개 선택</span>
            </div>
            {avatarsLoading ? (
              <p className="text-body-sm text-text-3">아바타 목록 불러오는 중…</p>
            ) : noSelectableAvatars ? (
              <p
                role="alert"
                className="text-body-sm text-warning border-border bg-bg-elev-2 rounded-sm border p-3"
              >
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
                  invalid={errors.requesterAvatarId !== undefined}
                  describedById={errors.requesterAvatarId !== undefined ? radioErrorId : undefined}
                />
                {errors.requesterAvatarId?.message && (
                  <p
                    id={radioErrorId}
                    role="alert"
                    className="text-mono-meta text-danger mt-1.5 font-mono"
                  >
                    {errors.requesterAvatarId.message}
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="match-request-greeting"
                className="text-mono-meta text-text-2 font-mono uppercase"
              >
                아바타가 건넬 첫 인사 (선택)
              </label>
              <span
                className={cn(
                  'text-mono-meta font-mono uppercase',
                  greetingLength > GREETING_MAX ? 'text-danger' : 'text-text-3'
                )}
              >
                {greetingLength}/{GREETING_MAX}
              </span>
            </div>
            <textarea
              id="match-request-greeting"
              rows={3}
              maxLength={GREETING_MAX + 20}
              placeholder="비워두면 아바타가 자율적으로 인사를 시작합니다"
              aria-invalid={errors.greeting ? true : undefined}
              aria-describedby={errors.greeting !== undefined ? greetingErrorId : undefined}
              {...register('greeting')}
              className={cn(
                'bg-bg-elev-2 text-body-sm text-text w-full resize-none rounded-sm border px-3 py-2',
                errors.greeting ? 'border-danger' : 'border-border-hi',
                'focus:border-brand focus:outline-none'
              )}
            />
            {errors.greeting?.message && (
              <p
                id={greetingErrorId}
                role="alert"
                className="text-mono-meta text-danger mt-1 font-mono"
              >
                {errors.greeting.message}
              </p>
            )}
          </div>

          <div
            id={costNoteId}
            className="bg-bg border-border-hi flex items-center justify-between rounded-sm border px-3 py-2"
          >
            <span className="text-body-sm text-text-2">
              매칭 요청 비용 · 상대 수락 시 채팅 시작
            </span>
            <span className="font-ui text-subheading text-brand font-medium">
              ◇ {REQUEST_COST_GEMS}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
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
              className="flex-[2]"
              disabled={isLoading || noSelectableAvatars}
              aria-busy={isLoading}
              aria-describedby={costNoteId}
            >
              {isLoading ? '요청 보내는 중…' : '요청 보내기 →'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
