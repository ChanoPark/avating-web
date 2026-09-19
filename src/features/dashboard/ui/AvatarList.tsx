import { Suspense, useState } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Compass } from 'lucide-react';
import { EmptyState } from '@shared/ui/EmptyState';
import { InlineError } from '@shared/ui/InlineError';
import { useSimCandidatesSuspense } from '@entities/avatar';
import { AvatarCard } from './AvatarCard';
import { DispatchModal } from './DispatchModal';

type AvatarListProps = {
  onAvatarClick: (id: string) => void;
};

// xl 4열 그리드를 두 줄 채운다 (서버 기본 10·상한 50). 서버가 랜덤으로 뽑아 정렬 기준은 없다.
const CANDIDATE_COUNT = 8;

type ModalState = { open: false } | { open: true; avatarId: string; avatarName: string };

// 그리드가 아닌 상태(빈 목록 · 오류 · 로딩)는 카드 한 장 위에 얹는다.
const PANEL_CLASS = 'border-subtle bg-canvas rounded-card border';

function AvatarListContent({ onAvatarClick }: AvatarListProps) {
  const { items: avatars } = useSimCandidatesSuspense(CANDIDATE_COUNT);
  const [modal, setModal] = useState<ModalState>({ open: false });

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
            onMatch={(id) => {
              setModal({ open: true, avatarId: id, avatarName: avatar.name });
            }}
          />
        ))}
      </ul>

      {modal.open && (
        <DispatchModal
          open={modal.open}
          avatarId={modal.avatarId}
          avatarName={modal.avatarName}
          onClose={() => {
            setModal({ open: false });
          }}
        />
      )}
    </>
  );
}

// 정본 S-11-06 PANEL — 실패한 영역만 교체하고 재시도는 그 자리에 둔다.
function AvatarListFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className={PANEL_CLASS}>
      <InlineError body="추천 아바타를 불러오지 못했어요" onRetry={resetErrorBoundary} />
    </div>
  );
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
  // 경계만 되살리면 재마운트된 suspense 쿼리가 캐시된 에러를 다시 던진다 — reset 을 걸어야 재시도가 재요청이 된다.
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary onReset={reset} fallbackRender={(props) => <AvatarListFallback {...props} />}>
      <Suspense fallback={<AvatarListSkeleton />}>
        <AvatarListContent onAvatarClick={onAvatarClick} />
      </Suspense>
    </ErrorBoundary>
  );
}
