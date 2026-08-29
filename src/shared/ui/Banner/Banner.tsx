import type { ReactNode } from 'react';
import { CircleAlert, Check, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

type BannerProps = {
  tone: BannerTone;
  title?: string;
  children: ReactNode;
  icon?: LucideIcon;
  onClose?: () => void;
  className?: string;
};

// wash 배경일 때는 테두리를 항상 transparent 로 둔다 — 틴트 채움과 동색 테두리를 같이
// 쓰면 v2 절대 규칙 ③ 위반이다.
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
 * S-11-07 FORM BANNER — 필드 단위 오류는 배너가 아니라 필드 아래 인라인(InlineError)으로 둔다.
 * 값은 feedback.css `.av-banner` 기본값이 아니라 wf-kit.jsx 의 compact 오버라이드를 따른다 —
 * 정본 화면이 실제로 그 값으로 그려졌기 때문이다.
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
