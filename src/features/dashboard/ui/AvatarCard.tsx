import { ArrowRight, Shield } from 'lucide-react';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { Tag } from '@shared/ui/Tag';
import type { RecommendedAvatar } from '@entities/dashboard';

type AvatarCardProps = {
  avatar: RecommendedAvatar;
  onOpen: (id: string) => void;
  onMatch: (id: string) => void;
};

// 목록은 행마다 반복되므로 채워진 파란 CTA 를 쓰지 않는다 (밴드당 primary 는 하나).
export function AvatarCard({ avatar, onOpen, onMatch }: AvatarCardProps) {
  return (
    <li className="border-hairline bg-surface shadow-card relative flex flex-col gap-2.5 rounded-lg border p-3.5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="bg-primary-wash text-primary text-caption flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] font-semibold uppercase"
        >
          {avatar.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5">
            {/* after 오버레이로 카드 전체를 클릭 대상으로 만든다 — 버튼을 중첩하지 않고 이름 버튼 하나로 처리한다. */}
            <button
              type="button"
              onClick={() => {
                onOpen(avatar.id);
              }}
              className="text-caption text-ink focus-visible:shadow-focus truncate rounded-xs font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
            >
              {avatar.name}
            </button>
            {avatar.verified && (
              <Badge variant="brand">
                <Shield size={11} strokeWidth={1.5} aria-hidden="true" />
                인증
              </Badge>
            )}
          </span>
          <span className="text-micro text-ink-mute truncate">
            {avatar.handle} · {avatar.type}
          </span>
        </span>
      </div>

      {avatar.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.25">
          {avatar.tags.slice(0, 3).map((tag) => (
            <li key={tag}>
              <Tag variant="neutral">{tag}</Tag>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-baseline gap-1.25">
          <span className="text-micro text-ink-mute">예상 호감도</span>
          <span className="text-caption text-ink tnum font-medium">{avatar.matchRate}</span>
        </span>
        <Button
          variant="secondary"
          size="sm"
          className="relative"
          onClick={() => {
            onMatch(avatar.id);
          }}
        >
          매칭
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
