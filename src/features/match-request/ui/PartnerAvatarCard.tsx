import { Shield } from 'lucide-react';
import { Badge } from '@shared/ui/Badge';
import type { AvatarStatus } from '@entities/avatar';

export type PartnerAvatarSummary = {
  initials: string;
  name: string;
  handle: string;
  type: string;
  verified: boolean;
  status: AvatarStatus;
};

type Props = {
  partner: PartnerAvatarSummary;
};

// wf-s3-request `ScreenMatchRequestSend` 의 상대 카드 — 이미지 44(r 11) + 이름 + 인증 배지 /
// 핸들·성향 micro / 우측 온라인 배지. 관심사 태그는 정본에 없다 (상세 화면에서 본다).
export function PartnerAvatarCard({ partner }: Props) {
  return (
    <div className="border-hairline bg-surface shadow-card flex items-center gap-2.75 rounded-lg border p-3.5">
      {/* 아바타 사각 — radius = size × 0.24, tone=wash (wash 배경 + primary 텍스트, 테두리 없음) */}
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
        <span className="text-micro text-ink-mute truncate">
          {partner.handle} · {partner.type}
        </span>
      </div>
      {partner.status === 'online' && (
        <Badge variant="success" dot className="shrink-0">
          온라인
        </Badge>
      )}
    </div>
  );
}
