import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Compass } from 'lucide-react';
import { EmptyState } from '@shared/ui/EmptyState';
import { useFailedQueryReset } from '@shared/lib/useFailedQueryReset';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';
import { avatarKeys, useSimCandidatesSuspense } from '@entities/avatar';
import type { AvatarSimCandidate } from '@entities/avatar';
import { MatchRequestModal } from '@features/match-request';
import { AvatarCard } from './AvatarCard';

type AvatarListProps = {
  onAvatarClick: (id: string) => void;
};

// xl 4열 그리드를 두 줄 채운다 (서버 기본 10·상한 50). 서버가 랜덤으로 뽑아 정렬 기준은 없다.
const CANDIDATE_COUNT = 8;

type RequestState = { open: boolean; partner: AvatarSimCandidate | null };

// 그리드가 아닌 상태(빈 목록 · 오류 · 로딩)는 카드 한 장 위에 얹는다.
const PANEL_CLASS = 'border-subtle bg-canvas rounded-card border';

function AvatarListContent({ onAvatarClick }: AvatarListProps) {
  const { items: avatars } = useSimCandidatesSuspense(CANDIDATE_COUNT);
  const [request, setRequest] = useState<RequestState>({ open: false, partner: null });

  if (avatars.length === 0) {
    return (
      <div className={PANEL_CLASS}>
        <EmptyState
          icon={Compass}
          title="추천할 아바타가 없어요"
          description="잠시 후 다시 확인해주세요"
        />
      </div>
    );
  }

  return (
    <>
      {/* 세그먼트 `표` 뷰는 미설계라 1차 제외 (spec-gap). */}
      <ul
        aria-label="추천 아바타 목록"
        className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {avatars.map((avatar) => (
          <AvatarCard
            key={avatar.avatarId}
            avatar={avatar}
            onOpen={onAvatarClick}
            onMatch={() => {
              setRequest({ open: true, partner: avatar });
            }}
          />
        ))}
      </ul>

      {request.partner !== null && (
        <MatchRequestModal
          open={request.open}
          partnerAvatarId={request.partner.avatarId}
          partner={request.partner}
          onClose={() => {
            setRequest((prev) => ({ ...prev, open: false }));
          }}
        />
      )}
    </>
  );
}

function AvatarListFallback() {
  useLoadErrorToast(true, '추천 아바타를 불러오지 못했어요');
  return <div className={`${PANEL_CLASS} min-h-[118px]`} />;
}

// 실제 카드와 같은 골격을 세운다 — 단순 텍스트로 두면 데이터 도착 시 카드 높이만큼 CLS 가 발생한다.
function AvatarListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid animate-pulse grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
    >
      <span className="sr-only">추천 아바타를 불러오는 중…</span>
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="border-subtle bg-canvas rounded-card flex flex-col gap-2.5 border p-3.5"
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-raised h-10 w-10 shrink-0 rounded-[10px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="bg-raised rounded-chip h-3 w-24" />
              <div className="bg-raised rounded-chip h-2.75 w-32" />
            </div>
          </div>
          <div className="flex gap-1.25">
            <div className="bg-raised h-5 w-14 rounded-full" />
            <div className="bg-raised h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="bg-raised rounded-chip h-3 w-20" />
            <div className="bg-raised h-8 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AvatarList({ onAvatarClick }: AvatarListProps) {
  const ready = useFailedQueryReset(avatarKeys.candidatesAll());

  return (
    <ErrorBoundary fallbackRender={() => <AvatarListFallback />}>
      <Suspense fallback={<AvatarListSkeleton />}>
        {ready ? <AvatarListContent onAvatarClick={onAvatarClick} /> : <AvatarListSkeleton />}
      </Suspense>
    </ErrorBoundary>
  );
}
