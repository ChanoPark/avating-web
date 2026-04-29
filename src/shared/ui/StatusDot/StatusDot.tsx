import { cn } from '@shared/lib/cn';
import type { AvatarStatus } from '@shared/lib/avatarStatus';

const statusConfig: Record<AvatarStatus, { colorClass: string; label: string }> = {
  online: { colorClass: 'bg-success', label: '온라인' },
  busy: { colorClass: 'bg-warning', label: '소개팅 중' },
  offline: { colorClass: 'bg-text-3', label: '오프라인' },
};

type StatusDotProps = {
  status: AvatarStatus;
  className?: string;
};

export function StatusDot({ status, className }: StatusDotProps) {
  const { colorClass, label } = statusConfig[status];
  return (
    <span
      role="img"
      aria-label={label}
      className={cn('inline-block h-2 w-2 rounded-full', colorClass, className)}
    />
  );
}
