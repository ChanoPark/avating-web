import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Button } from '@shared/ui/Button';
import { MatchRequestModal } from '@features/match-request';
import type { PartnerAvatarSummary } from '@features/match-request';
import { AvatarProfileHeader, AvatarStatsRadar, AvatarIntroPanel } from '@features/avatar-profile';
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
    tags: avatar.tags,
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
      <AvatarProfileHeader
        avatar={avatar}
        renderCta={() => (
          <Button
            type="button"
            variant="primary"
            disabled={ctaDisabled}
            title={ctaDisabled ? '이미 매칭 중인 아바타입니다' : undefined}
            onClick={() => {
              setRequestOpen(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={requestOpen}
          >
            매칭 요청
          </Button>
        )}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AvatarStatsRadar stats={avatar.stats} />
        <AvatarIntroPanel publicInfo={avatar.publicInfo} />
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
    <div className="text-text-3 text-body-sm" aria-busy="true" aria-live="polite">
      아바타 정보를 불러오는 중…
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const isNotFound = isApiError(error) && error.statusCode === 404;
  return (
    <div role="alert" className="border-border bg-bg-elev-1 rounded-md border p-6">
      <h2 className="font-ui text-subheading text-text">
        {isNotFound ? '아바타를 찾을 수 없어요' : '아바타 정보를 불러오지 못했어요'}
      </h2>
      <p className="text-text-2 text-body-sm mt-2">
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
    <section className="flex flex-col gap-4">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<LoadingFallback />}>
          <AvatarDetailContent id={id} />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}
