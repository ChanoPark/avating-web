import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Compass } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { EmptyState } from '@shared/ui/EmptyState';
import { cn } from '@shared/lib/cn';
import type { RecommendedAvatarFilter } from '@entities/dashboard';
import { useRecommendedAvatars } from '../api/useRecommendedAvatars';
import { AvatarCard } from './AvatarCard';
import { DispatchModal } from './DispatchModal';

type AvatarListProps = {
  filter: RecommendedAvatarFilter;
  onAvatarClick: (id: string) => void;
  onResetFilter: () => void;
};

type ModalState = { open: false } | { open: true; avatarId: string; avatarName: string };

// 그리드가 아닌 상태(빈 목록 · 오류 · 로딩)는 카드 한 장 위에 얹는다.
const PANEL_CLASS = 'border-hairline bg-surface shadow-card rounded-lg border';

function AvatarListContent({ filter, onAvatarClick, onResetFilter }: AvatarListProps) {
  const { items: avatars } = useRecommendedAvatars(filter);
  const [modal, setModal] = useState<ModalState>({ open: false });

  if (avatars.length === 0) {
    return (
      <div className={PANEL_CLASS}>
        <EmptyState
          icon={Compass}
          title="추천 아바타 없음"
          description="필터를 조정하거나 잠시 후 다시 확인해주세요"
          action={{ label: '필터 초기화', onClick: onResetFilter }}
        />
      </div>
    );
  }

  return (
    <>
      {/* 4열 카드 그리드 gap 12 (wf-s2-core ScreenDashboard). 세그먼트 `표` 뷰는 미설계라 1차 제외. */}
      <ul
        aria-label="추천 아바타 목록"
        className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {avatars.map((avatar) => (
          <AvatarCard
            key={avatar.id}
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

function AvatarListFallback({ onResetFilter }: { onResetFilter: () => void }) {
  return (
    <div className={cn(PANEL_CLASS, 'flex flex-col items-center justify-center py-12 text-center')}>
      <div className="text-body-sm text-ink-secondary">목록을 불러오지 못했어요.</div>
      <Button variant="ghost" size="sm" className="mt-4" onClick={onResetFilter}>
        필터 초기화
      </Button>
    </div>
  );
}

/**
 * 로딩 스켈레톤은 실제 4열 카드 그리드와 같은 골격을 세운다. 한 줄 텍스트로 두면
 * 데이터 도착 시 대시보드 하단이 카드 높이만큼 통째로 밀려 CLS 가 발생한다.
 * 카드 내부 3단(아바타 행 / 태그 행 / 호감도+버튼 행)을 AvatarCard 와 맞춘다.
 */
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
          className="border-hairline bg-surface shadow-card flex flex-col gap-2.5 rounded-lg border p-3.5"
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-canvas-soft h-10 w-10 shrink-0 rounded-[10px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="bg-canvas-soft h-3 w-24 rounded" />
              <div className="bg-canvas-soft h-2.75 w-32 rounded" />
            </div>
          </div>
          <div className="flex gap-1.25">
            <div className="bg-canvas-soft rounded-pill h-5 w-14" />
            <div className="bg-canvas-soft rounded-pill h-5 w-16" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="bg-canvas-soft h-3 w-20 rounded" />
            <div className="bg-canvas-soft rounded-pill h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AvatarList({ filter, onAvatarClick, onResetFilter }: AvatarListProps) {
  return (
    <ErrorBoundary fallback={<AvatarListFallback onResetFilter={onResetFilter} />}>
      <Suspense fallback={<AvatarListSkeleton />}>
        <AvatarListContent
          filter={filter}
          onAvatarClick={onAvatarClick}
          onResetFilter={onResetFilter}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
