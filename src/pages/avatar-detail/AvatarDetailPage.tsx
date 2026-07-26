import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { ArrowRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
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
    handle: avatar.handle,
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
      {/* wf-s2-core `ScreenAvatarDetail` — 좌 flex 1 / 우 260 고정, gap 14 */}
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
          {/* 정본 우 하단 ghost block. 관전 라우트는 아직 없어 동작은 후속 PR 이다
              (대시보드의 `추가하기` · `전체 보기` 와 같은 자리표시 액션). */}
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

function LoadingFallback() {
  return (
    <div className="text-ink-mute text-caption" aria-busy="true" aria-live="polite">
      아바타 정보를 불러오는 중…
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const isNotFound = isApiError(error) && error.statusCode === 404;
  return (
    <div role="alert" className="border-hairline bg-surface shadow-card rounded-lg border p-6">
      <h2 className="text-heading-sm text-ink">
        {isNotFound ? '아바타를 찾을 수 없어요' : '아바타 정보를 불러오지 못했어요'}
      </h2>
      <p className="text-body-sm text-ink-mute mt-1.5">
        {isNotFound ? '주소가 잘못됐거나 삭제된 아바타일 수 있어요.' : '잠시 후 다시 시도해주세요.'}
      </p>
      {!isNotFound && (
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => {
            resetErrorBoundary();
          }}
        >
          다시 시도
        </Button>
      )}
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
