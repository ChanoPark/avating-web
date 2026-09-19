import { useState } from 'react';
import { useNavigate } from 'react-router';
import { StatsGrid, StatsRetryAction } from '@features/dashboard/ui/StatsGrid';
import { AvatarList } from '@features/dashboard/ui/AvatarList';
import { MyAvatarGrid } from '@features/dashboard/ui/MyAvatarGrid';
import { InboxPanel } from '@features/dashboard/ui/InboxPanel';

export function DashboardPage() {
  // 카드마다 경계를 따로 두되 재시도는 묶음 단위다(정본 S-11-06). 액션을 두 열 바깥에 두어야
  // 좌우 열의 윗단이 맞고, stat↔알림 세로 간격이 열 사이 가로 간격(14px)과 같아진다.
  const [statsResetKey, setStatsResetKey] = useState(0);
  const [failedStatCount, setFailedStatCount] = useState(0);
  const navigate = useNavigate();

  function handleAvatarClick(id: string) {
    void navigate(`/avatars/${id}`);
  }

  function handleStatCardFailed() {
    setFailedStatCount((c) => c + 1);
  }

  function handleStatsRetry() {
    setFailedStatCount(0);
    setStatsResetKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-3.5">
      {failedStatCount > 0 && <StatsRetryAction onRetry={handleStatsRetry} />}
      <div className="flex flex-col items-stretch gap-3.5 lg:flex-row">
        <div className="lg:w-75 lg:shrink-0">
          <MyAvatarGrid />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <StatsGrid resetKey={statsResetKey} onCardFailed={handleStatCardFailed} />
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
