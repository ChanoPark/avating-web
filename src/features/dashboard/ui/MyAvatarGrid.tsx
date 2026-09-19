import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { InlineError } from '@shared/ui/InlineError';
import { StatRadar, STAT_RADAR_MIN_AXES, statRadarBox } from '@shared/ui/StatRadar';
import { cn } from '@shared/lib/cn';
import { useElementWidth } from '@shared/lib/useElementWidth';
import { PERSONA_STAT_KEYS, personaStatRows, usePrimaryAvatarSuspense } from '@entities/avatar';
import type { AvatarSummary, PersonaStatRow } from '@entities/avatar';
import { avatarInitial } from '../lib/avatarInitial';

// 폭은 페이지(부모)가 준다 — 여기서는 지정하지 않는다. @container 로 카드 폭에 따라 성향 배치를 바꾼다.
// 높이는 h-full 로 부모 행(items-stretch)에 맞춘다 — 정본 wf-s2-core ScreenDashboard 의
// `<Row align="stretch">` 직속 Card 와 같은 결과다. 감싸는 div 만 늘어나고 카드가 남으면 우측 열과 밑단이 어긋난다.
const CARD_CLASS =
  '@container border-subtle bg-canvas flex h-full flex-col gap-3 rounded-card border p-4';

// 카드가 넓으면(컨테이너 ≥ 384px) 정본(.cx-radar · .wf2-radarrow gap 28)대로 레이더 옆에 값 표,
// 좁으면(lg 폭 300 카드·모바일) 위아래로 쌓는다. 스켈레톤도 같은 규칙을 따라야 로드 순간 상자가 같다.
// 레이더를 크게 보이려고(사용자 요청 2026-09-19) 남는 폭은 레이더 칸이 갖고, 값 표는 128px 로 둔다.
const STATS_LAYOUT_CLASS = 'flex flex-col items-center gap-3 @sm:flex-row @sm:gap-7';
const RADAR_CELL_CLASS = 'flex w-full min-w-0 justify-center @sm:flex-1';
const STATS_TABLE_CLASS = 'w-full @sm:w-32 @sm:shrink-0';

function CardHeader() {
  return <h2 className="text-caption text-primary font-medium">대표 아바타</h2>;
}

// 7지표 전부를 가정한 레이더 라벨 — 스켈레톤이 실제 레이더와 같은 계산(statRadarBox)으로 상자를 세운다.
const SKELETON_RADAR_LABELS = personaStatRows(
  Object.fromEntries(PERSONA_STAT_KEYS.map((key) => [key, 0]))
).map((row) => row.label);

function RadarSkeleton() {
  const [cellRef, cellWidth] = useElementWidth<HTMLDivElement>();
  const box = statRadarBox(SKELETON_RADAR_LABELS, cellWidth > 0 ? cellWidth : undefined);
  return (
    <div ref={cellRef} className={RADAR_CELL_CLASS}>
      <svg
        data-testid="stat-radar-skeleton"
        aria-hidden="true"
        width={box.width}
        height={box.height}
      >
        <circle
          cx={box.width / 2}
          cy={box.height / 2}
          r={Math.min(box.width, box.height) / 2}
          fill="var(--bg-raised)"
        />
      </svg>
    </div>
  );
}

// 실제 콘텐츠와 같은 골격을 세운다 — 헤더 · 44px 요약 · 구분선 · 레이더(실제와 같은 상자) · 지표 7행(행당 25px).
// 카드가 행 높이를 정할 때가 있어, 골격이 다르면 로드 순간 상단 행과 아래 섹션이 함께 움직인다.
function MyAvatarGridSkeleton() {
  return (
    <section aria-label="대표 아바타" aria-busy="true" className={cn(CARD_CLASS, 'animate-pulse')}>
      <div className="bg-raised rounded-chip h-4 w-16" />
      <div className="bg-raised h-11 rounded-[11px]" />
      <hr className="border-subtle border-t" />
      <div className={STATS_LAYOUT_CLASS}>
        <RadarSkeleton />
        <div className={cn('flex flex-col', STATS_TABLE_CLASS)}>
          {PERSONA_STAT_KEYS.map((key) => (
            <div key={key} className="flex h-6.25 items-center justify-between">
              <div className="bg-raised rounded-chip h-3 w-12" />
              <div className="bg-raised rounded-chip h-3 w-6" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 정본 S-11-06 PANEL — 실패한 영역만 교체하고 재시도는 그 자리에 둔다.
function MyAvatarGridFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <section aria-label="대표 아바타" className={CARD_CLASS}>
      <CardHeader />
      <InlineError body="대표 아바타를 불러오지 못했어요" onRetry={resetErrorBoundary} />
    </section>
  );
}

function EmptyAvatarBody() {
  return (
    <p className="text-caption text-secondary">
      아직 아바타가 없어요. 아바타를 만들면 여기에서 상태를 확인할 수 있어요.
    </p>
  );
}

// 상태·진행 중 매칭 수는 서버가 주지 않아 그리지 않는다 — 대표 아바타 조회가 주는 값(이름·해시태그·소개·성향)만 쓴다.
function PrimaryAvatarSummary({ avatar }: { avatar: AvatarSummary }) {
  return (
    <div className="flex items-center gap-2.75">
      <span
        aria-hidden="true"
        className="bg-id-none text-id-none-fg text-caption flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] font-semibold uppercase"
      >
        {avatarInitial(avatar.name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.75">
        {/* 이름#태그는 한 덩어리로 쓴다(wf2-spec) — 줄바꿈 없이 함께 잘린다. */}
        <span className="text-caption text-primary truncate font-medium">
          {avatar.name}
          <span className="text-secondary font-normal">#{avatar.hashtag}</span>
        </span>
        {avatar.description !== '' && (
          <span className="text-meta text-secondary truncate">{avatar.description}</span>
        )}
      </span>
    </div>
  );
}

function PrimaryAvatarDetails({ avatar }: { avatar: AvatarSummary }) {
  const rows = personaStatRows(avatar.stats);
  return (
    <>
      <PrimaryAvatarSummary avatar={avatar} />
      {rows.length > 0 && (
        <>
          <hr className="border-subtle border-t" />
          <PersonaStats rows={rows} />
        </>
      )}
    </>
  );
}

// 정본(S-03-01)은 StatRadar 6축 + 값 표지만, 서버가 주는 PersonaStatType 7지표를 그대로 그린다(사용자 결정 2026-09-19).
// 형태만으로 값을 전하지 않으므로 값 표는 항상 둔다. 배치는 STATS_LAYOUT_CLASS 참고.
// 표 라벨은 정본(.cx-radar__table th)의 --text-muted 대신 secondary 다 — muted 는 3.93:1 로 AA 미달이라
// 읽어야 하는 글자에 쓰지 않는다(axe 게이트). 레이더 축 라벨은 정본대로 muted 다.
function PersonaStats({ rows }: { rows: PersonaStatRow[] }) {
  // 레이더 칸의 실제 폭에 맞춰 반지름을 고른다 — 카드가 넓을수록 레이더가 커진다.
  const [radarCellRef, radarCellWidth] = useElementWidth<HTMLDivElement>();
  const hasRadar = rows.length >= STAT_RADAR_MIN_AXES;
  return (
    <div className={STATS_LAYOUT_CLASS}>
      {hasRadar && (
        <div ref={radarCellRef} className={RADAR_CELL_CLASS}>
          <StatRadar
            stats={rows.map((row) => row.value)}
            labels={rows.map((row) => row.label)}
            {...(radarCellWidth > 0 ? { maxWidth: radarCellWidth } : {})}
          />
        </div>
      )}
      <table className={cn('border-collapse', hasRadar ? STATS_TABLE_CLASS : 'w-full')}>
        <caption className="sr-only">성향 지표</caption>
        <tbody>
          {rows.map(({ key, label, value }) => (
            <tr key={key}>
              <th scope="row" className="text-meta text-secondary py-0.75 text-left font-normal">
                {label}
              </th>
              <td className="text-caption text-primary tnum py-0.75 pl-4 text-right">
                {Math.round(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MyAvatarGridContent() {
  const primary = usePrimaryAvatarSuspense();

  return (
    <section aria-label="대표 아바타" className={CARD_CLASS}>
      <CardHeader />
      {primary === null ? <EmptyAvatarBody /> : <PrimaryAvatarDetails avatar={primary} />}
    </section>
  );
}

export function MyAvatarGrid() {
  // 경계만 되살리면 재마운트된 suspense 쿼리가 캐시된 에러를 다시 던진다 — reset 을 걸어야 재시도가 재요청이 된다.
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary onReset={reset} fallbackRender={(props) => <MyAvatarGridFallback {...props} />}>
      <Suspense fallback={<MyAvatarGridSkeleton />}>
        <MyAvatarGridContent />
      </Suspense>
    </ErrorBoundary>
  );
}
