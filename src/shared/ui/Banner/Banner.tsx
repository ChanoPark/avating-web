import type { ReactNode } from 'react';
import { CircleAlert, Check, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

type BannerProps = {
  tone: BannerTone;
  /** 굵은 한 줄 요약. 없으면 본문만 그린다. */
  title?: string;
  children: ReactNode;
  /** 기본 아이콘 대신 쓸 lucide 아이콘. 정본 S-11-07 의 세션 만료 배너는 clock 을 쓴다. */
  icon?: LucideIcon;
  /** 주면 우측에 닫기 버튼이 붙는다. */
  onClose?: () => void;
  className?: string;
};

// 톤별 배경 — 전부 wash 다. 틴트 채움 + 같은 색 테두리 조합은 v2 절대 규칙 ③ 위반이라
// wash 를 쓰는 순간 테두리는 transparent 로 둔다 (feedback.css `.av-banner--*`).
const toneSurface: Record<BannerTone, string> = {
  info: 'bg-primary-wash border-transparent',
  success: 'bg-success-wash border-transparent',
  warning: 'bg-warning-wash border-transparent',
  danger: 'bg-danger-wash border-transparent',
};

const toneIconColor: Record<BannerTone, string> = {
  info: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

const toneIcon: Record<BannerTone, LucideIcon> = {
  info: Info,
  success: Check,
  warning: CircleAlert,
  danger: CircleAlert,
};

/**
 * 폼·화면 상단에 고정하는 지속형 알림 (S-11-07 FORM BANNER).
 *
 * 정본 규칙 — "배너는 폼·화면 맨 위에 고정하고 스크롤되어도 사용자가 먼저 보게 합니다.
 * 필드 단위 오류는 배너로 올리지 않고 필드 아래 인라인으로 둡니다(S-10-01)."
 *
 * 시각 값은 `wf-kit.jsx` 의 `Banner` 가 렌더하는 실제 치수를 따른다 —
 * padding 11px 13px · fontSize 13 · 아이콘 16. `css/feedback.css` 의 `.av-banner` 기본값
 * (14px 16px · 14px · 18px)은 컴포넌트 계약이지만, 정본 화면에 그려진 배너는 전부
 * wf-kit 의 compact 오버라이드를 거친다. 화면 대조 기준이 후자라 이쪽을 택했다.
 */
export function Banner({ tone, title, children, icon, onClose, className }: BannerProps) {
  const Icon = icon ?? toneIcon[tone];
  // 실패·주의는 즉시 읽어야 하므로 alert, 안내·완료는 방해하지 않는 status 로 알린다.
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={cn(
        'text-ink-secondary flex items-start gap-3 rounded-md border px-[13px] py-[11px] text-[13px] leading-[1.5]',
        toneSurface[tone],
        className
      )}
    >
      <Icon
        size={16}
        strokeWidth={1.5}
        aria-hidden="true"
        className={cn('mt-px shrink-0', toneIconColor[tone])}
      />
      <div className="min-w-0 flex-1">
        {title !== undefined && <div className="text-ink font-medium">{title}</div>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="알림 닫기"
          className="text-ink-faint hover:text-ink shrink-0 cursor-pointer transition-colors"
        >
          <X size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
