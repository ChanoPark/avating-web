import { Link } from 'react-router';
import { MATCH_REQUEST_COST_GEMS } from '@entities/match-request';

export type InlineErrorKind = 'insufficient-gems' | 'network';

type Props = {
  id: string;
  kind: InlineErrorKind;
  retryDisabled?: boolean;
  onRetry?: () => void;
};

export function InlineErrorPanel({ id, kind, retryDisabled, onRetry }: Props) {
  if (kind === 'insufficient-gems') {
    return (
      <div
        id={id}
        role="alert"
        className="border-danger bg-bg-elev-2 text-body-sm text-text flex flex-col gap-2 rounded-sm border p-3"
      >
        <span className="font-medium">다이아가 부족해요</span>
        <span className="text-text-2">
          매칭 요청에는 ◇ {MATCH_REQUEST_COST_GEMS}이 필요해요. 충전 후 다시 시도해주세요.
        </span>
        <Link to="/shop" className="text-mono-meta text-brand self-start font-mono uppercase">
          충전하러 가기 →
        </Link>
      </div>
    );
  }

  return (
    <div
      id={id}
      role="alert"
      className="border-danger bg-bg-elev-2 text-body-sm text-text flex flex-col gap-2 rounded-sm border p-3"
    >
      <span className="font-medium">전송에 실패했어요</span>
      <span className="text-text-2">
        네트워크 오류로 요청을 보내지 못했어요. 같은 내용으로 다시 시도할 수 있어요.
      </span>
      <button
        type="button"
        disabled={retryDisabled}
        onClick={onRetry}
        className="text-mono-meta text-brand self-start font-mono uppercase disabled:opacity-50"
      >
        다시 시도
      </button>
    </div>
  );
}
