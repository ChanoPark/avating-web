import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { MATCH_REQUEST_COST_GEMS } from '@entities/match-request';
import { CreditAmount } from './CreditAmount';

export type InlineErrorKind = 'insufficient-gems' | 'network';

type Props = {
  id: string;
  kind: InlineErrorKind;
  retryDisabled?: boolean;
  onRetry?: () => void;
};

// 에러 패널은 danger wash 서피스가 아니라 흰 서피스 + danger 테두리다
// (틴트 채움 + 같은 색 테두리 금지).
const panelClass =
  'border-danger bg-surface text-caption text-ink flex flex-col gap-2 rounded-lg border p-3';

export function InlineErrorPanel({ id, kind, retryDisabled, onRetry }: Props) {
  if (kind === 'insufficient-gems') {
    return (
      <div id={id} role="alert" className={panelClass}>
        <span className="font-medium">다이아가 부족해요</span>
        <span className="text-ink-secondary">
          매칭 요청에는 <CreditAmount amount={MATCH_REQUEST_COST_GEMS} />가 필요해요. 충전 후 다시
          시도해주세요.
        </span>
        <Link
          to="/shop"
          className="text-micro text-primary hover:text-primary-hover inline-flex items-center gap-1 self-start font-medium"
        >
          충전하러 가기
          <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div id={id} role="alert" className={panelClass}>
      <span className="font-medium">전송에 실패했어요</span>
      <span className="text-ink-secondary">
        네트워크 오류로 요청을 보내지 못했어요. 같은 내용으로 다시 시도할 수 있어요.
      </span>
      <button
        type="button"
        disabled={retryDisabled}
        onClick={onRetry}
        className="text-micro text-primary hover:text-primary-hover cursor-pointer self-start font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        다시 시도
      </button>
    </div>
  );
}
