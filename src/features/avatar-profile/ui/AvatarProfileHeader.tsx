import { Tag } from '@shared/ui/Tag';
import { StatusDot } from '@shared/ui/StatusDot';
import type { AvatarDetail } from '@entities/avatar';

type Props = {
  avatar: AvatarDetail;
  // 매칭 요청 CTA — props 로 위임해 caller 가 모달 트리거 + busy 가드 처리.
  renderCta: () => React.ReactNode;
};

export function AvatarProfileHeader({ avatar, renderCta }: Props) {
  return (
    <header className="border-border bg-bg-elev-1 flex items-start gap-4 rounded-md border p-4">
      <div
        aria-hidden="true"
        className="bg-bg-elev-3 border-border-hi text-text-2 font-ui text-ui flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border font-medium"
      >
        {avatar.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-ui text-subheading text-text truncate">{avatar.name}</h2>
          {avatar.verified && <Tag variant="success">인증</Tag>}
          <Tag variant="brand">Lv.{avatar.level}</Tag>
          <StatusDot status={avatar.status} />
        </div>
        <p className="text-mono-meta text-text-3 mt-1 font-mono">
          {avatar.handle} · {avatar.type}
        </p>
        {avatar.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {avatar.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex-shrink-0">{renderCta()}</div>
    </header>
  );
}
