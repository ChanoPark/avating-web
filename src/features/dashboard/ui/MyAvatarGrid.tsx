import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { InlineError } from '@shared/ui/InlineError';
import { StatRadar, STAT_RADAR_MIN_AXES } from '@shared/ui/StatRadar';
import { cn } from '@shared/lib/cn';
import { PERSONA_STAT_KEYS, personaStatRows, usePrimaryAvatarSuspense } from '@entities/avatar';
import type { AvatarSummary, PersonaStatRow } from '@entities/avatar';
import { avatarInitial } from '../lib/avatarInitial';

// 폭 300 고정은 페이지(부모)가 준다 — 여기서는 지정하지 않는다.
// 높이는 h-full 로 부모 행(items-stretch)에 맞춘다 — 정본 wf-s2-core ScreenDashboard 의
// `<Row align="stretch">` 직속 Card 와 같은 결과다. 감싸는 div 만 늘어나고 카드가 남으면 우측 열과 밑단이 어긋난다.
const CARD_CLASS = 'border-subtle bg-canvas flex h-full flex-col gap-3 rounded-card border p-4';

function CardHeader({ action }: { action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-caption text-primary font-medium">내 아바타</h2>
      {action}
    </div>
  );
}

// 실제 콘텐츠와 같은 골격을 세운다 — 헤더 · 44px 요약 · 구분선 · 176px 레이더 · 지표 7행(행당 25px).
// 카드가 우측 열보다 길어 행 높이를 정하므로, 골격이 짧으면 로드 순간 두 열이 함께 늘어난다.
function MyAvatarGridSkeleton() {
  return (
    <section aria-label="내 아바타" aria-busy="true" className={cn(CARD_CLASS, 'animate-pulse')}>
      <div className="flex items-center justify-between">
        <div className="bg-raised rounded-chip h-4 w-16" />
        <div className="bg-raised rounded-chip h-4 w-14" />
      </div>
      <div className="bg-raised h-11 rounded-[11px]" />
      <hr className="border-subtle border-t" />
      <div className="flex flex-col items-center gap-3">
        <div className="bg-raised size-44 rounded-full" />
        <div className="flex w-full flex-col">
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
    <section aria-label="내 아바타" className={CARD_CLASS}>
      <CardHeader />
      <InlineError body="내 아바타를 불러오지 못했어요" onRetry={resetErrorBoundary} />
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
// 형태만으로 값을 전하지 않으므로 값 표는 항상 둔다. 폭 300 카드에서는 정본의 가로 배치가 들어가지 않아 위아래로 쌓는다.
// 표 라벨은 정본(.cx-radar__table th)의 --text-muted 대신 secondary 다 — muted 는 3.93:1 로 AA 미달이라
// 읽어야 하는 글자에 쓰지 않는다(axe 게이트). 레이더 축 라벨은 정본대로 muted 다.
function PersonaStats({ rows }: { rows: PersonaStatRow[] }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {rows.length >= STAT_RADAR_MIN_AXES && (
        <StatRadar stats={rows.map((row) => row.value)} labels={rows.map((row) => row.label)} />
      )}
      <table className="w-full border-collapse">
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
    <section aria-label="내 아바타" className={CARD_CLASS}>
      <CardHeader
        action={
          <button
            type="button"
            aria-label="아바타 추가하기"
            className="text-action hover:text-action-hover text-meta ease-standard cursor-pointer font-medium transition-colors duration-[var(--dur-fast)]"
          >
            추가하기
          </button>
        }
      />
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
