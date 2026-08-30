import { Shield } from 'lucide-react';
import { Badge } from '@shared/ui/Badge';
import type { AvatarStatus } from '@entities/avatar';

export type PartnerAvatarSummary = {
  initials: string;
  name: string;
  type: string;
  verified: boolean;
  status: AvatarStatus;
};

type Props = {
  partner: PartnerAvatarSummary;
};

// 관심사 태그는 정본(wf-s3-request)에 없다 — 상세 화면에서 본다.
export function PartnerAvatarCard({ partner }: Props) {
  return (
    <div className="border-hairline bg-surface shadow-card flex items-center gap-2.75 rounded-lg border p-3.5">
      <div
        aria-hidden="true"
        className="bg-primary-wash text-primary text-body-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] font-semibold uppercase"
      >
        {partner.initials}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <div className="flex items-center gap-1.5">
          <span className="text-caption text-ink truncate font-medium">{partner.name}</span>
          {partner.verified && (
            <Badge variant="brand">
              <Shield size={11} strokeWidth={1.5} aria-hidden="true" />
              인증
            </Badge>
          )}
        </div>
        <span className="text-micro text-ink-mute truncate">{partner.type}</span>
      </div>
      {partner.status === 'online' && (
        <Badge variant="success" dot className="shrink-0">
          온라인
        </Badge>
      )}
    </div>
  );
}
