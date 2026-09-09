type Props = {
  id: string;
  retryDisabled?: boolean;
  onRetry?: () => void;
};

// 에러 패널은 danger wash 서피스가 아니라 흰 서피스 + danger 테두리다 (틴트 채움 금지).
const panelClass =
  'border-danger-mark bg-canvas text-caption text-primary flex flex-col gap-2 rounded-card border p-3';

export function InlineErrorPanel({ id, retryDisabled, onRetry }: Props) {
  return (
    <div id={id} role="alert" className={panelClass}>
      <span className="font-medium">전송에 실패했어요</span>
      <span className="text-secondary">
        네트워크 오류로 요청을 보내지 못했어요. 같은 내용으로 다시 시도할 수 있어요.
      </span>
      <button
        type="button"
        disabled={retryDisabled}
        onClick={onRetry}
        className="text-meta text-action hover:text-action-hover cursor-pointer self-start font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        다시 시도
      </button>
    </div>
  );
}
