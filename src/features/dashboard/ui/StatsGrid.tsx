import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Send, Heart, Users } from 'lucide-react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { StatsCard } from '@shared/ui/StatsCard';
import { cn } from '@shared/lib/cn';
import { useDashboardStats } from '../api/useDashboardStats';
import type { DashboardStats } from '@entities/dashboard';

const STAT_BOX = 'border-subtle bg-canvas rounded-card border p-3.5';

// 실제 StatsCard 와 같은 3단 구조를 그대로 세운다 — 라인 하나만 두면 도착 시 카드가 늘어나 CLS 가 생긴다.
function StatsSkeleton() {
  return (
    <div className={cn(STAT_BOX, 'flex animate-pulse flex-col gap-1')}>
      <div className="flex items-center gap-2">
        <div className="bg-raised rounded-chip h-3.25 w-3.25 shrink-0" />
        <div className="bg-raised rounded-chip h-2.5 w-16" />
      </div>
      <div className="bg-raised rounded-chip h-6.5 w-20" />
      <div className="bg-raised rounded-chip h-2.75 w-24" />
    </div>
  );
}

// 정본 S-11-06 STAT — 재시도 버튼은 카드 안이 아니라 묶음 단위 액션에서 한 번에 처리한다.
function StatsFallback({ config }: { config: CardConfig }) {
  return <StatsCard failed icon={config.Icon} label={config.label} value="" ariaLabel="" />;
}

type CardConfig = {
  label: string;
  getValue: (stats: DashboardStats) => string;
  getDelta: (stats: DashboardStats) => { text: string; tone: 'positive' | 'negative' | 'neutral' };
  getAriaLabel: (stats: DashboardStats) => string;
  Icon: typeof Send;
};

const CARD_CONFIGS: CardConfig[] = [
  {
    label: '총 매칭 횟수',
    Icon: Send,
    getValue: (s) => String(s.totalDispatched),
    getDelta: (s) => ({
      text: `${s.totalDispatchedDelta >= 0 ? '+' : ''}${s.totalDispatchedDelta} 지난주 대비`,
      tone:
        s.totalDispatchedDelta > 0
          ? 'positive'
          : s.totalDispatchedDelta < 0
            ? 'negative'
            : 'neutral',
    }),
    getAriaLabel: (s) =>
      `총 매칭 횟수 ${s.totalDispatched}회, 지난주 대비 ${s.totalDispatchedDelta >= 0 ? `${s.totalDispatchedDelta} 증가` : `${Math.abs(s.totalDispatchedDelta)} 감소`}`,
  },
  {
    label: '평균 호감도',
    Icon: Heart,
    getValue: (s) => `${s.avgAffinity}/100`,
    getDelta: (s) => ({
      text: `${s.avgAffinityDelta >= 0 ? '+' : ''}${s.avgAffinityDelta}pt`,
      tone: s.avgAffinityDelta > 0 ? 'positive' : s.avgAffinityDelta < 0 ? 'negative' : 'neutral',
    }),
    getAriaLabel: (s) =>
      `평균 호감도 ${s.avgAffinity}점, ${s.avgAffinityDelta >= 0 ? `+${s.avgAffinityDelta}pt` : `${s.avgAffinityDelta}pt`}`,
  },
  {
    // 정본 4번째 슬롯은 `연결 성사`(Users) — 같은 지표를 도메인 용어(에프터 연결)로 부른다.
    label: '에프터 연결',
    Icon: Users,
    getValue: (s) => String(s.matches),
    getDelta: (s) => ({
      text: `매칭 성공률 ${s.matchRate.toFixed(1)}%`,
      tone: 'neutral',
    }),
    getAriaLabel: (s) => `에프터 연결 ${s.matches}건, 매칭 성공률 ${s.matchRate.toFixed(1)}%`,
  },
];

function SingleStatCard({ config }: { config: CardConfig }) {
  const data = useDashboardStats();
  return (
    <StatsCard
      icon={config.Icon}
      label={config.label}
      value={config.getValue(data)}
      delta={config.getDelta(data)}
      ariaLabel={config.getAriaLabel(data)}
    />
  );
}

type StatsGridProps = {
  resetKey: number;
  onCardFailed: () => void;
};

// 재시도 액션(StatsRetryAction)은 이 컴포넌트가 아니라 대시보드 상단, 두 열 바깥에서 렌더된다.
// 우측 열 안에 두면 stat 카드만 아래로 밀려 좌측 '내 아바타' 카드와 윗단이 어긋나고,
// stat↔알림 세로 간격도 가로 간격(14px)과 달라진다.
export function StatsGrid({ resetKey, onCardFailed }: StatsGridProps) {
  // suspense 쿼리는 error reset boundary 가 리셋되기 전까지 retryOnMount=false 다.
  // ErrorBoundary 만 resetKeys 로 되살리면 재마운트된 카드가 캐시된 에러를 다시 던져
  // 재요청 없이 실패 상태로 돌아온다 — reset 을 함께 걸어야 재시도가 실제 fetch 가 된다.
  const { reset } = useQueryErrorResetBoundary();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {CARD_CONFIGS.map((config) => (
        <ErrorBoundary
          key={config.label}
          resetKeys={[resetKey]}
          onReset={reset}
          onError={onCardFailed}
          fallbackRender={() => <StatsFallback config={config} />}
        >
          <Suspense fallback={<StatsSkeleton />}>
            <SingleStatCard config={config} />
          </Suspense>
        </ErrorBoundary>
      ))}
    </div>
  );
}

export function StatsRetryAction({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        className="text-caption text-action hover:text-action-hover cursor-pointer rounded-full px-1 font-medium"
        onClick={onRetry}
      >
        통계 다시 불러오기
      </button>
    </div>
  );
}
