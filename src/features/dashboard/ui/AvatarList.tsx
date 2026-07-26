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

export function AvatarList({ filter, onAvatarClick, onResetFilter }: AvatarListProps) {
  return (
    <ErrorBoundary fallback={<AvatarListFallback onResetFilter={onResetFilter} />}>
      <Suspense
        fallback={
          <div className={cn(PANEL_CLASS, 'text-ink-mute text-caption py-12 text-center')}>
            로딩 중…
          </div>
        }
      >
        <AvatarListContent
          filter={filter}
          onAvatarClick={onAvatarClick}
          onResetFilter={onResetFilter}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
