import { AvatarIdentityTile, AvatarTagBadge } from '@entities/avatar';
import type { AvatarDetail } from '@entities/avatar';

export type PartnerAvatarSummary = Pick<AvatarDetail, 'name' | 'hashtag' | 'description' | 'color'>;

type Props = {
  partner: PartnerAvatarSummary;
};

// 관심사 태그는 정본(wf-s3-request)에 없다 — 상세 화면에서 본다.
// 인증·온라인 상태는 서버 상세 응답에 없어 그리지 않는다.
export function PartnerAvatarCard({ partner }: Props) {
  return (
    <div className="border-subtle bg-canvas rounded-card flex items-center gap-2.75 border p-3.5">
      <AvatarIdentityTile
        name={partner.name}
        color={partner.color}
        className="text-caption h-11 w-11 rounded-[11px]"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-caption text-primary truncate font-medium">{partner.name}</span>
          <AvatarTagBadge hashtag={partner.hashtag} />
        </div>
        {partner.description !== '' && (
          <span className="text-meta text-secondary truncate">{partner.description}</span>
        )}
      </div>
    </div>
  );
}
