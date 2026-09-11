import type { AvatarPublicInfo } from '@entities/avatar';

type Props = {
  publicInfo: AvatarPublicInfo;
};

const PUBLIC_INFO_ROWS: { key: keyof AvatarPublicInfo; label: string }[] = [
  { key: 'ageRange', label: '나이대' },
  { key: 'region', label: '지역' },
  { key: 'job', label: '직군' },
];

// 세션 이력(호감도·턴)은 프라이버시 사유로 노출하지 않고 비식별 공개 정보만 보여준다.
export function AvatarIntroPanel({ publicInfo }: Props) {
  return (
    <section
      aria-labelledby="avatar-public-info-heading"
      className="border-subtle bg-canvas rounded-card flex flex-col border p-4"
    >
      <h3 id="avatar-public-info-heading" className="text-caption text-primary font-medium">
        공개 정보
      </h3>
      <dl className="mt-1 flex flex-col">
        {PUBLIC_INFO_ROWS.map((row) => (
          <div
            key={row.key}
            className="border-subtle text-caption flex items-center justify-between gap-2 border-b py-2.25 last:border-0"
          >
            <dt className="text-secondary">{row.label}</dt>
            <dd className="text-primary truncate text-right">{publicInfo[row.key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
