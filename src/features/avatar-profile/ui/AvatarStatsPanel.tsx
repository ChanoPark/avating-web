import { PersonaStats, personaStatRows } from '@entities/avatar';

type Props = {
  stats: Record<string, number>;
};

// 대시보드 대표 아바타와 같은 PersonaStats(레이더 + 값 표)로 서버 PersonaStatType 7지표를 그린다.
// @container — PersonaStats 가 카드 폭을 보고 레이더·값 표를 나란히 둘지 쌓을지 정한다.
export function AvatarStatsPanel({ stats }: Props) {
  return (
    <section
      aria-labelledby="avatar-stats-heading"
      className="border-subtle bg-canvas rounded-card @container flex flex-col gap-3 border p-4"
    >
      <h3 id="avatar-stats-heading" className="text-caption text-primary font-medium">
        아바타 스탯
      </h3>
      <PersonaStats rows={personaStatRows(stats)} />
    </section>
  );
}
