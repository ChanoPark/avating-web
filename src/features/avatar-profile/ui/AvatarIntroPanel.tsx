import type { AvatarPublicInfo } from '@entities/avatar';

type Props = {
  publicInfo: AvatarPublicInfo;
};

const PUBLIC_INFO_ROWS: { key: keyof AvatarPublicInfo; label: string }[] = [
  { key: 'ageRange', label: '나이대' },
  { key: 'region', label: '지역' },
  { key: 'job', label: '직군' },
];

// wf-s2-core `ScreenAvatarDetail` 우측 `공개 정보` PropertyList — 행 13px, padding `9px 0`,
// 행 사이 hairline (LAYOUT-NUMBERS § PropertyList 행). 세션 이력(호감도·턴) 노출은
// 프라이버시 사유로 제거되고 비식별 공개 정보로 대체됨 (chat2/8/13).
export function AvatarIntroPanel({ publicInfo }: Props) {
  return (
    <section
      aria-labelledby="avatar-public-info-heading"
      className="border-hairline bg-surface shadow-card flex flex-col rounded-lg border p-4"
    >
      <h3 id="avatar-public-info-heading" className="text-caption text-ink font-medium">
        공개 정보
      </h3>
      <dl className="mt-1 flex flex-col">
        {PUBLIC_INFO_ROWS.map((row) => (
          <div
            key={row.key}
            className="border-hairline text-caption flex items-center justify-between gap-2 border-b py-2.25 last:border-0"
          >
            <dt className="text-ink-mute">{row.label}</dt>
            <dd className="text-ink truncate text-right">{publicInfo[row.key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
