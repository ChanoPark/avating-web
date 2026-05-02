import type { AvatarStatus } from '@shared/lib/avatarStatus';
import { matchRateColor } from '@shared/lib/matchRateColor';
import { StatusDot } from '@shared/ui/StatusDot';
import { Tag } from '@shared/ui/Tag';
import { Button } from '@shared/ui/Button';
import { cn } from '@shared/lib/cn';

const matchRateColorClass: Record<ReturnType<typeof matchRateColor>, string> = {
  success: 'text-success',
  default: 'text-text',
  warning: 'text-warning',
};

type AvatarListRowProps = {
  id?: string;
  initials: string;
  name: string;
  handle: string;
  type: string;
  tags: string[];
  matchRate: number;
  status: AvatarStatus;
  verified: boolean;
  onRowClick: (id: string) => void;
  onMatchClick: (id: string) => void;
};

export function AvatarListRow({
  id = '',
  initials,
  name,
  handle,
  type,
  tags,
  matchRate,
  status,
  verified,
  onRowClick,
  onMatchClick,
}: AvatarListRowProps) {
  const rateColorClass = matchRateColorClass[matchRateColor(matchRate)];

  function handleRowClick() {
    onRowClick(id);
  }

  function handleRowKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(id);
    }
  }

  function handleMatchClick(e: React.MouseEvent) {
    e.stopPropagation();
    onMatchClick(id);
  }

  return (
    <div
      role="row"
      data-testid="avatar-list-row"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      className={cn(
        'border-border grid cursor-pointer border-b px-4 py-3 transition-colors',
        'grid-cols-[1fr_140px_180px_100px_120px]',
        'hover:bg-bg-elev-3 focus-visible:outline-brand focus-visible:outline-2'
      )}
    >
      {/* 아바타 */}
      <div className="flex items-center gap-3">
        <div className="bg-bg-elev-3 border-border-hi flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
          <span className="font-ui text-mono-meta text-text-2 font-semibold uppercase">
            {initials}
          </span>
        </div>
        <div>
          <div className="font-ui text-ui text-text flex items-center gap-1.5">
            {name}
            {verified && <Tag variant="success">인증</Tag>}
          </div>
          <div className="text-mono-meta text-text-3 font-mono">{handle}</div>
        </div>
        <StatusDot status={status} className="ml-1" />
      </div>

      {/* 유형 */}
      <div className="text-body-sm text-text-2 flex items-center">{type}</div>

      {/* 관심사 */}
      <div className="flex flex-wrap items-center gap-1">
        {tags.slice(0, 3).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      {/* 호환도 */}
      <div className={cn('font-ui text-ui flex items-center font-semibold', rateColorClass)}>
        {matchRate}%
      </div>

      {/* 액션 */}
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={handleMatchClick}>
          매칭
        </Button>
      </div>
    </div>
  );
}
