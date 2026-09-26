import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { InlineError } from '@shared/ui/InlineError';
import { statRadarBox } from '@shared/ui/StatRadar';
import { cn } from '@shared/lib/cn';
import { useElementWidth } from '@shared/lib/useElementWidth';
import {
  AvatarIdentityTile,
  AvatarTagBadge,
  PERSONA_STAT_KEYS,
  PERSONA_STATS_CLASS,
  PersonaStats,
  personaStatRows,
  usePrimaryAvatarSuspense,
} from '@entities/avatar';
import type { AvatarSummary } from '@entities/avatar';

// 폭은 페이지(부모)가 준다 — 여기서는 지정하지 않는다. @container 로 카드 폭에 따라 성향 배치(PERSONA_STATS_CLASS)를 바꾼다.
// 높이는 h-full 로 부모 행(items-stretch)에 맞춘다 — 정본 wf-s2-core ScreenDashboard 의
// `<Row align="stretch">` 직속 Card 와 같은 결과다. 감싸는 div 만 늘어나고 카드가 남으면 우측 열과 밑단이 어긋난다.
const CARD_CLASS =
  '@container border-subtle bg-canvas flex h-full flex-col gap-3 rounded-card border p-4';

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
    <div ref={cellRef} className={PERSONA_STATS_CLASS.radarCell}>
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

// 실제 콘텐츠와 같은 골격을 세운다 — 헤더 · 요약(44px 타일 옆 이름·뱃지 한 행 20 · 소개 18, 간격 4) · 구분선 · 레이더(실제와 같은 상자) · 지표 7행(행당 25px).
// 카드가 행 높이를 정할 때가 있어, 골격이 다르면 로드 순간 상단 행과 아래 섹션이 함께 움직인다.
function MyAvatarGridSkeleton() {
  return (
    <section aria-label="대표 아바타" aria-busy="true" className={cn(CARD_CLASS, 'animate-pulse')}>
      <div className="bg-raised rounded-chip h-4 w-16" />
      <div className="flex items-center gap-2.75">
        <div className="bg-raised h-11 w-11 shrink-0 rounded-[11px]" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex h-5 items-center gap-1.5">
            <div className="bg-raised rounded-chip h-3 w-16" />
            <div className="bg-raised h-5 w-18 rounded-full" />
          </div>
          <div className="flex h-4.5 items-center">
            <div className="bg-raised rounded-chip h-3 w-40" />
          </div>
        </div>
      </div>
      <hr className="border-subtle border-t" />
      <div className={PERSONA_STATS_CLASS.layout}>
        <RadarSkeleton />
        <div className={cn('flex flex-col', PERSONA_STATS_CLASS.table)}>
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
      <AvatarIdentityTile
        name={avatar.name}
        color={avatar.color}
        className="text-caption h-11 w-11 rounded-[11px]"
      />
      {/* 이름이 가장 크게 보이고 태그 뱃지는 같은 줄 옆에 붙는다(사용자 결정 2026-09-25). */}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-lead text-primary truncate font-semibold">{avatar.name}</span>
          <AvatarTagBadge hashtag={avatar.hashtag} />
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
