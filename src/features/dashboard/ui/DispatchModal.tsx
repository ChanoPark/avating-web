import { useState } from 'react';
import { Modal } from '@shared/ui/Modal';
import { Button } from '@shared/ui/Button';
import { useToast } from '@shared/ui/Toast';
import { useCreateSession } from '../api/useCreateSession';
import { isApiError } from '@shared/lib/errors';

type DispatchModalProps = {
  open: boolean;
  avatarId: string;
  avatarName: string;
  onClose: () => void;
};

export function DispatchModal({ open, avatarId, avatarName, onClose }: DispatchModalProps) {
  const { show } = useToast();
  const { mutate, isPending } = useCreateSession();
  const [inlineError, setInlineError] = useState<string | null>(null);

  function handleConfirm() {
    setInlineError(null);
    mutate(
      { avatarId },
      {
        onSuccess: () => {
          show({ variant: 'success', title: '매칭 요청을 보냈어요' });
          onClose();
        },
        onError: (err) => {
          if (isApiError(err) && err.statusCode === 402 && err.code === 'INSUFFICIENT_GEMS') {
            setInlineError('다이아가 부족해요.');
            show({ variant: 'error', title: '다이아가 부족해요. 충전 페이지로 이동' });
          } else {
            show({
              variant: 'error',
              title: '매칭 요청에 실패했어요. 잠시 후 다시 시도해주세요.',
            });
          }
        },
      }
    );
  }

  function handleClose() {
    if (!isPending) onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="매칭 확인"
      description={`${avatarName} 아바타와 매칭을 시작할까요?`}
      footer={
        <div className="flex w-full flex-col gap-3">
          {inlineError !== null && (
            <div className="text-body-sm text-danger">
              {inlineError}
              <button
                type="button"
                className="text-brand ml-2 underline"
                onClick={() => {
                  onClose();
                }}
              >
                충전
              </button>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isPending}>
              취소
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={isPending}>
              {isPending ? '요청 중…' : '매칭하기'}
            </Button>
          </div>
        </div>
      }
    />
  );
}
