import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@shared/ui/Button';
import { AvatarListRow } from '@shared/ui/AvatarListRow';
import type { RecommendedAvatarFilter } from '@entities/dashboard';
import { useRecommendedAvatars } from '../api/useRecommendedAvatars';
import { DispatchModal } from './DispatchModal';

type AvatarListProps = {
  filter: RecommendedAvatarFilter;
  onAvatarClick: (id: string) => void;
  onResetFilter: () => void;
};

type ModalState = { open: false } | { open: true; avatarId: string; avatarName: string };

function AvatarListContent({ filter, onAvatarClick, onResetFilter }: AvatarListProps) {
  const { items: avatars } = useRecommendedAvatars(filter);
  const [modal, setModal] = useState<ModalState>({ open: false });

  if (avatars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-heading text-text">추천 아바타 없음</div>
        <p className="text-body-sm text-text-2 mt-2">필터를 조정하거나 잠시 후 다시 확인해주세요</p>
        <Button variant="ghost" size="sm" className="mt-6" onClick={onResetFilter}>
          필터 초기화
        </Button>
      </div>
    );
  }

  return (
    <>
      <div role="table" aria-label="추천 아바타 목록">
        <div
          role="row"
          className="border-border grid border-b px-4 py-2"
          style={{ gridTemplateColumns: '1fr 140px 1fr 100px 120px' }}
        >
          {['아바타', '유형', '관심사', '호환도', ''].map((h, i) => (
            <div
              key={i}
              role="columnheader"
              className="text-mono-micro text-text-3 font-mono uppercase"
            >
              {h}
            </div>
          ))}
        </div>
        {avatars.map((avatar) => (
          <AvatarListRow
            key={avatar.id}
            id={avatar.id}
            initials={avatar.initials}
            name={avatar.name}
            handle={avatar.handle}
            type={avatar.type}
            tags={avatar.tags}
            matchRate={avatar.matchRate}
            status={avatar.status}
            verified={avatar.verified}
            onRowClick={onAvatarClick}
            onMatchClick={(id) => {
              setModal({ open: true, avatarId: id, avatarName: avatar.name });
            }}
          />
        ))}
      </div>

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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-body-sm text-text-2">목록을 불러오지 못했어요.</div>
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
        fallback={<div className="text-text-3 text-body-sm py-8 text-center">로딩 중…</div>}
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
