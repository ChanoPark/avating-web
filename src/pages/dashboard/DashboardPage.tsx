import { useNavigate } from 'react-router';
import { StatsGrid } from '@features/dashboard/ui/StatsGrid';
import { AvatarList } from '@features/dashboard/ui/AvatarList';
import { MyAvatarGrid } from '@features/dashboard/ui/MyAvatarGrid';
import { InboxPanel } from '@features/dashboard/ui/InboxPanel';

export function DashboardPage() {
  const navigate = useNavigate();

  function handleAvatarClick(id: string) {
    void navigate(`/avatars/${id}`);
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col items-stretch gap-3.5 lg:flex-row">
        {/* xl 에서는 대표 아바타 카드와 우측 열을 반씩 나눠 레이더를 크게 보인다(사용자 결정 2026-09-19).
            lg 에서 넓히면 우측 stat 카드 3장이 좁아져 300 을 둔다. */}
        <div className="lg:w-75 lg:shrink-0 xl:w-auto xl:min-w-0 xl:flex-1">
          <MyAvatarGrid />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <StatsGrid />
          <InboxPanel />
        </div>
      </div>

      {/* 후보 조회(/api/avatars/candidates)는 필터·정렬 파라미터가 없고 랜덤으로 뽑는다 — 칩을 두지 않는다. */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lead text-primary">추천 아바타</h2>
        <span className="text-meta text-secondary">
          공개된 아바타 중에서 무작위로 골라 보여줘요
        </span>
      </div>

      <AvatarList onAvatarClick={handleAvatarClick} />
    </div>
  );
}
