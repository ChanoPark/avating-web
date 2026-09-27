import { Tag } from '@shared/ui/Tag';
import { AvatarIdentityTile, AvatarTagBadge } from '@entities/avatar';
import type { AvatarDetail } from '@entities/avatar';

type Props = {
  avatar: AvatarDetail;
};

// 매칭 요청 CTA 는 우측 featured 카드가 가진다 —
// 이 헤더에는 버튼을 추가하지 않는다 (화면당 채워진 파란 CTA 는 하나).
// 인증·성향 유형은 서버 상세 응답에 없어 그리지 않는다.
export function AvatarProfileHeader({ avatar }: Props) {
  return (
    <header className="border-subtle bg-canvas rounded-card flex flex-col gap-3 border p-4">
      <div className="flex items-center gap-3">
        <AvatarIdentityTile
          name={avatar.name}
          color={avatar.color}
          className="text-lead rounded-card h-14 w-14"
        />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.75">
          <h2 className="text-lead text-primary truncate">{avatar.name}</h2>
          <AvatarTagBadge hashtag={avatar.hashtag} />
        </div>
      </div>
      {avatar.description.length > 0 && (
        <p className="text-caption text-secondary text-pretty">{avatar.description}</p>
      )}
      {avatar.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {avatar.tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
