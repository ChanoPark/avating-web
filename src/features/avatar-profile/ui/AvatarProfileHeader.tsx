import { Shield } from 'lucide-react';
import { Badge } from '@shared/ui/Badge';
import { Tag } from '@shared/ui/Tag';
import type { AvatarDetail } from '@entities/avatar';

type Props = {
  avatar: AvatarDetail;
};

// 매칭 요청 CTA 는 우측 featured 카드가 가진다 —
// 이 헤더에는 버튼을 추가하지 않는다 (화면당 채워진 파란 CTA 는 하나).
export function AvatarProfileHeader({ avatar }: Props) {
  return (
    <header className="border-hairline bg-surface shadow-card flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-primary-wash text-primary text-heading-sm flex h-14 w-14 shrink-0 items-center justify-center rounded-lg font-semibold uppercase"
        >
          {avatar.initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.75">
            <h2 className="text-heading-sm text-ink truncate">{avatar.name}</h2>
            {avatar.verified && (
              <Badge variant="brand">
                <Shield size={11} strokeWidth={1.5} aria-hidden="true" />
                인증
              </Badge>
            )}
          </div>
          <p className="text-caption text-ink-mute">
            {avatar.handle} · {avatar.type}
          </p>
        </div>
      </div>
      {avatar.description.length > 0 && (
        <p className="text-body-sm text-ink-secondary text-pretty">{avatar.description}</p>
      )}
      {avatar.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {avatar.tags.map((tag) => (
            <li key={tag}>
              <Tag variant="neutral">{tag}</Tag>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
