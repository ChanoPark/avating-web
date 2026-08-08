import { cn } from '@shared/lib/cn';

/** panel = 카드·패널 안, table = 표 본문 자리. 정본의 `h` 기본값 118 / 130 에 대응한다. */
export type InlineErrorKind = 'panel' | 'table';

type InlineErrorProps = {
  kind?: InlineErrorKind;
  title?: string;
  body?: string;
  retryLabel?: string;
  /** 없으면 재시도 버튼을 그리지 않는다 — 되돌릴 방법이 없는 자리도 있다. */
  onRetry?: () => void;
  className?: string;
};

// 정본이 못박은 높이. 스켈레톤·정상 콘텐츠와 같은 세로 공간을 차지해야
// 로드 실패가 주변 레이아웃을 끌어올리지 않는다(CLS).
const kindMinHeight: Record<InlineErrorKind, string> = {
  panel: 'min-h-[118px]',
  table: 'min-h-[130px]',
};

/**
 * 영역 단위 로드 실패 (S-11-06 InlineFail).
 *
 * 정본 규칙 — "화면 전체를 에러로 덮지 않고, 실패한 영역만 교체합니다.
 * 재시도는 실패한 자리에." 화면 전체가 죽었을 때는 이게 아니라 `ErrorPage` 다.
 */
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
      <div className="text-caption text-ink font-medium">{title}</div>
      <div className="text-micro text-ink-mute max-w-[250px] text-pretty">{body}</div>
      {onRetry && (
        // 정본은 여기에 secondary(흰 서피스 + 파란 테두리) 버튼을 둔다. 화면당 채워진
        // 파란 CTA 는 1개뿐이어야 하고(v2 절대 규칙 ①), 인라인 실패는 그 1개가 아니다.
        <button
          type="button"
          onClick={onRetry}
          className="border-primary bg-surface text-primary rounded-pill hover:bg-primary-wash focus-visible:shadow-focus mt-[3px] cursor-pointer border px-3 py-1.5 text-[13px] font-medium transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
