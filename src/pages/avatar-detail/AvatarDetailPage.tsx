import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { ArrowRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { InlineError } from '@shared/ui/InlineError';
import { MatchRequestModal } from '@features/match-request';
import { AvatarProfileHeader, AvatarStatsPanel, AvatarMatchPanel } from '@features/avatar-profile';
import { PersonaStatsSkeleton, useAvatarDetailSuspense } from '@entities/avatar';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';
import { isApiError } from '@shared/lib/errors';
import { useLoadErrorFallback } from '@shared/lib/useLoadErrorFallback';

function AvatarDetailContent({ id }: { id: string }) {
  const avatar = useAvatarDetailSuspense(id);
  const [requestOpen, setRequestOpen] = useState(false);
  const setBreadcrumbTrail = useChromeBreadcrumbStore((s) => s.setTrail);
  const clearBreadcrumbTrail = useChromeBreadcrumbStore((s) => s.clearTrail);

  useEffect(() => {
    setBreadcrumbTrail(['홈', '대시보드', avatar.name]);
    return () => {
      clearBreadcrumbTrail();
    };
  }, [avatar.name, setBreadcrumbTrail, clearBreadcrumbTrail]);

  // 진행 중 초대에 걸린 아바타는 서버가 canRequestSimulation=false 로 준다. 본인·비공개 아바타는 서버가 404 로 막는다.
  const ctaDisabled = !avatar.canRequestSimulation;

  return (
    <>
      <div className="flex flex-col items-stretch gap-3.5 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <AvatarProfileHeader avatar={avatar} />
          <AvatarStatsPanel stats={avatar.stats} />
        </div>
        <div className="flex flex-col gap-3.5 lg:w-65 lg:shrink-0">
          <AvatarMatchPanel
            onRequest={() => {
              setRequestOpen(true);
            }}
            requestOpen={requestOpen}
            disabled={ctaDisabled}
            {...(ctaDisabled ? { disabledReason: '이미 매칭 중인 아바타예요' } : {})}
          />
          {/* 관전 라우트가 아직 없어 이 버튼에는 동작을 연결하지 않는다(후속 PR). */}
          <Button variant="ghost" block>
            지난 시뮬레이션 관전
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <MatchRequestModal
        open={requestOpen}
        partnerAvatarId={avatar.avatarId}
        partner={avatar}
        onClose={() => {
          setRequestOpen(false);
        }}
      />
    </>
  );
}

const SKELETON_CARD = 'border-subtle bg-canvas rounded-card border p-4';

/** 실제 렌더와 다른 골격을 쓰면 데이터 도착 시 레이아웃이 밀려 CLS 가 발생한다 — 2열 구조를 그대로 유지한다. */
function LoadingFallback() {
  return (
    <div
      className="flex animate-pulse flex-col items-stretch gap-3.5 lg:flex-row"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">아바타 정보를 불러오는 중…</span>

      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <div className={SKELETON_CARD}>
          <div className="flex items-start gap-4">
            <div className="bg-raised rounded-card h-14 w-14 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="bg-raised rounded-chip h-4 w-40" />
              <div className="bg-raised rounded-chip h-3 w-56" />
              <div className="bg-raised rounded-chip mt-1 h-3 w-full" />
            </div>
          </div>
        </div>
        {/* 실제 AvatarStatsPanel 과 같은 @container 카드 — 레이더 상자가 같은 폭 계산을 따른다. */}
        <div className={`@container ${SKELETON_CARD} flex flex-col gap-3`}>
          <div className="bg-raised rounded-chip h-4 w-20" />
          <PersonaStatsSkeleton />
        </div>
      </div>

      <div className="flex flex-col gap-3.5 lg:w-65 lg:shrink-0">
        <div className={SKELETON_CARD}>
          <div className="bg-raised h-9 w-full rounded-full" />
          <div className="bg-raised rounded-chip mx-auto mt-2.5 h-3 w-24" />
        </div>
        <div className="bg-raised h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

const ERROR_PANEL_CLASS = 'border-subtle bg-canvas rounded-card border p-6';

function LoadErrorPanel() {
  useLoadErrorFallback('아바타 정보를 불러오지 못했어요');
  return <div className={`${ERROR_PANEL_CLASS} min-h-[118px]`} />;
}

// 없는 아바타는 일시적인 로딩 실패가 아니라 이 주소의 최종 상태라 토스트가 아니라 본문 자리에 알린다.
// 400 은 id 가 UUID 형식이 아닌 주소라 없는 아바타와 같이 보여준다.
function ErrorFallback({ error }: FallbackProps) {
  const isNotFound = isApiError(error) && (error.statusCode === 404 || error.statusCode === 400);
  if (!isNotFound) return <LoadErrorPanel />;
  return (
    <div className={ERROR_PANEL_CLASS}>
      <InlineError
        title="아바타를 찾을 수 없어요"
        body="주소가 잘못됐거나 삭제된 아바타일 수 있어요."
      />
    </div>
  );
}

export function AvatarDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  return (
    <section className="flex flex-col gap-3.5">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<LoadingFallback />}>
          <AvatarDetailContent id={id} />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}
