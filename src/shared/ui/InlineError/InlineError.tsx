import { cn } from '@shared/lib/cn';
import { Button } from '../Button';

// panel = 카드·패널 안, table = 표 본문 자리.
type InlineErrorKind = 'panel' | 'table';

type InlineErrorProps = {
  kind?: InlineErrorKind;
  title?: string;
  body?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

// 스켈레톤·정상 콘텐츠와 같은 높이를 유지해야 로드 실패가 레이아웃을 밀어내지 않는다(CLS).
const kindMinHeight: Record<InlineErrorKind, string> = {
  panel: 'min-h-[118px]',
  table: 'min-h-[130px]',
};

// 영역 단위 로드 실패 전용이다(S-11-06) — 화면 전체가 죽었을 때는 ErrorPage 를 쓴다.
export function InlineError({
  kind = 'panel',
  title = '불러오지 못했어요',
  body = '잠시 후 다시 시도해 주세요',
  retryLabel = '다시 시도',
  onRetry,
  className,
}: InlineErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-[7px] px-3 py-4 text-center',
        kindMinHeight[kind],
        className
      )}
    >
      <div className="text-caption text-primary font-medium">{title}</div>
      <div className="text-meta text-secondary max-w-[250px] text-pretty">{body}</div>
      {onRetry && (
        // 화면당 파란 채움은 하나뿐이라(Codex 절대 규칙 ①) 재시도는 secondary 다.
        <Button type="button" variant="secondary" size="sm" className="mt-[3px]" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
