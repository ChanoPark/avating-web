import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { ArrowRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { InlineError } from '@shared/ui/InlineError';
import { MatchRequestModal } from '@features/match-request';
import type { PartnerAvatarSummary } from '@features/match-request';
import {
  AvatarProfileHeader,
  AvatarStatsPanel,
  AvatarIntroPanel,
  AvatarMatchPanel,
} from '@features/avatar-profile';
import { useAvatarDetailSuspense } from '@entities/avatar';
import type { AvatarDetail } from '@entities/avatar';
import { useChromeBreadcrumbStore } from '@shared/lib/chromeBreadcrumb';
import { isApiError } from '@shared/lib/errors';

function toPartnerSummary(avatar: AvatarDetail): PartnerAvatarSummary {
  return {
    initials: avatar.initials,
    name: avatar.name,
    type: avatar.type,
    verified: avatar.verified,
    status: avatar.status,
  };
}

function AvatarDetailContent({ id }: { id: string }) {
  const avatar = useAvatarDetailSuspense(id);
  const [requestOpen, setRequestOpen] = useState(false);
  const setBreadcrumbTrail = useChromeBreadcrumbStore((s) => s.setTrail);
  const clearBreadcrumbTrail = useChromeBreadcrumbStore((s) => s.clearTrail);

  useEffect(() => {
    setBreadcrumbTrail(['홈', '탐색', avatar.name]);
    return () => {
      clearBreadcrumbTrail();
    };
  }, [avatar.name, setBreadcrumbTrail, clearBreadcrumbTrail]);

  // 와이어 §6.2.5 의 "busy / 본인 아바타 / 차단" 가드는 후속 PR. 본 PR 은 busy 시 disabled 만 노출.
  const ctaDisabled = avatar.status === 'busy';

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
            {...(ctaDisabled ? { disabledReason: '이미 매칭 중인 아바타입니다' } : {})}
          />
          <AvatarIntroPanel publicInfo={avatar.publicInfo} />
          {/* 관전 라우트가 아직 없어 이 버튼에는 동작을 연결하지 않는다(후속 PR). */}
          <Button variant="ghost" block>
            지난 시뮬레이션 관전
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <MatchRequestModal
        open={requestOpen}
        partnerAvatarId={avatar.id}
        partner={toPartnerSummary(avatar)}
        onClose={() => {
          setRequestOpen(false);
        }}
      />
    </>
  );
}

const SKELETON_CARD = 'border-hairline bg-surface shadow-card rounded-lg border p-4';

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
            <div className="bg-canvas-soft h-14 w-14 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="bg-canvas-soft h-4 w-40 rounded" />
              <div className="bg-canvas-soft h-3 w-56 rounded" />
              <div className="bg-canvas-soft mt-1 h-3 w-full rounded" />
            </div>
          </div>
        </div>
        <div className={SKELETON_CARD}>
          <div className="bg-canvas-soft h-3 w-20 rounded" />
          <div className="mt-3 flex flex-col gap-2.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-canvas-soft h-3 w-18 shrink-0 rounded" />
                <div className="bg-canvas-soft h-1.5 flex-1 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 lg:w-65 lg:shrink-0">
        <div className={SKELETON_CARD}>
          <div className="bg-canvas-soft rounded-pill h-9 w-full" />
          <div className="bg-canvas-soft mx-auto mt-2.5 h-3 w-24 rounded" />
        </div>
        <div className={SKELETON_CARD}>
          <div className="bg-canvas-soft h-3 w-16 rounded" />
          <div className="mt-3 flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-canvas-soft h-3 w-full rounded" />
            ))}
          </div>
        </div>
        <div className="bg-canvas-soft rounded-pill h-10 w-full" />
      </div>
    </div>
  );
}

// 본문만 실패한 경우라 화면 전체가 아니라 이 패널만 에러로 덮는다(셸·브레드크럼은 유지).
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const isNotFound = isApiError(error) && error.statusCode === 404;
  return (
    <div className="border-hairline bg-surface shadow-card rounded-lg border p-6">
      <InlineError
        title={isNotFound ? '아바타를 찾을 수 없어요' : '아바타 정보를 불러오지 못했어요'}
        body={
          isNotFound ? '주소가 잘못됐거나 삭제된 아바타일 수 있어요.' : '잠시 후 다시 시도해 주세요'
        }
        {...(isNotFound ? {} : { onRetry: resetErrorBoundary })}
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
