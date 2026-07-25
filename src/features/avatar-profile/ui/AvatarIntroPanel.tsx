import type { AvatarPublicInfo } from '@entities/avatar';

type Props = {
  publicInfo: AvatarPublicInfo;
};

const PUBLIC_INFO_ROWS: { key: keyof AvatarPublicInfo; label: string }[] = [
  { key: 'ageRange', label: '나이대' },
  { key: 'region', label: '지역' },
  { key: 'job', label: '직군' },
];

// 상대 아바타 상세의 우측 패널. 세션 이력(호감도·턴) 노출은 프라이버시 사유로 제거되고
// 비식별 공개 정보(나이대/지역/직군)로 대체됨 (chat2/8/13).
export function AvatarIntroPanel({ publicInfo }: Props) {
  return (
    <section
      aria-labelledby="avatar-public-info-heading"
      className="border-border bg-bg-elev-1 flex flex-col rounded-md border p-4"
    >
      <h3
        id="avatar-public-info-heading"
        className="text-mono-micro text-text-3 font-mono uppercase"
      >
        공개 정보
      </h3>
      <dl className="mt-3 flex flex-col gap-2">
        {PUBLIC_INFO_ROWS.map((row) => (
          <div
            key={row.key}
            className="border-border flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
          >
            <dt className="text-body-sm text-text-3">{row.label}</dt>
            <dd className="text-body-sm text-text">{publicInfo[row.key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
