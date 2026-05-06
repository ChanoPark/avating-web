import { Tag } from '@shared/ui/Tag';
import { StatusDot } from '@shared/ui/StatusDot';
import type { AvatarStatus } from '@entities/avatar';

export type PartnerAvatarSummary = {
  initials: string;
  name: string;
  handle: string;
  type: string;
  verified: boolean;
  status: AvatarStatus;
  tags: readonly string[];
};

type Props = {
  partner: PartnerAvatarSummary;
};

export function PartnerAvatarCard({ partner }: Props) {
  return (
    <div className="bg-bg-elev-2 border-border flex items-center gap-3 rounded-md border p-3">
      <div
        aria-hidden="true"
        className="bg-bg-elev-3 border-border-hi text-text-2 font-ui text-ui flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border font-medium"
      >
        {partner.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-ui text-subheading text-text truncate">{partner.name}</span>
          {partner.verified && <Tag variant="success">인증</Tag>}
        </div>
        <p className="text-mono-meta text-text-3 mt-0.5 font-mono">
          {partner.handle} · {partner.type}
        </p>
        {partner.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {partner.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <StatusDot status={partner.status} />
        {partner.status === 'online' && <Tag variant="success">온라인</Tag>}
      </div>
    </div>
  );
}
