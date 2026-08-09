import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Send, Heart, Users, Diamond } from 'lucide-react';
import { StatsCard } from '@shared/ui/StatsCard';
import { cn } from '@shared/lib/cn';
import { useDashboardStats } from '../api/useDashboardStats';
import type { DashboardStats } from '@entities/dashboard';

// StatCard 와 같은 상자 규격 — padding 14, radius `--r-lg`, hairline + shadow-card.
const STAT_BOX = 'border-hairline bg-surface shadow-card rounded-lg border p-3.5';

// StatsCard 와 같은 3단 구조(아이콘+라벨 행 / 26px value / delta 행)를 그대로 세운다.
// 라인 하나만 두면 데이터 도착 시 카드가 눈에 띄게 늘어나 CLS 가 생긴다.
function StatsSkeleton() {
  return (
    <div className={cn(STAT_BOX, 'flex animate-pulse flex-col gap-1')}>
      <div className="flex items-center gap-2">
        <div className="bg-canvas-soft h-3.25 w-3.25 shrink-0 rounded" />
        <div className="bg-canvas-soft h-2.5 w-16 rounded" />
      </div>
      <div className="bg-canvas-soft h-6.5 w-20 rounded" />
      <div className="bg-canvas-soft h-2.75 w-24 rounded" />
    </div>
  );
}

// 정본 S-11-06 STAT — 실패한 카드는 값만 `—` 로 두고 라벨은 유지한다. 재시도 버튼을
// 카드 안에 넣지 않는다: "재시도는 카드 묶음 상단 액션에서 한 번에."
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
  {
    label: '잔여 다이아',
    Icon: Diamond,
    getValue: (s) => String(s.gemsBalance),
    getDelta: (s) => ({
      // 다이아 사용량은 부정 신호가 아닌 단순 메타 → 중립색 (design-v2 §04)
      text: `-${s.gemsUsed} 이번 주 사용`,
      tone: 'neutral',
    }),
    getAriaLabel: (s) => `잔여 다이아 ${s.gemsBalance}개, 이번 주 ${s.gemsUsed} 사용`,
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

export function StatsGrid() {
  // 카드마다 경계를 따로 두되 재시도는 묶음 단위다(정본 S-11-06). `resetKey` 를 올리면
  // 모든 경계가 한 번에 복구를 시도한다.
  const [resetKey, setResetKey] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      {failedCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-caption text-primary hover:text-primary-hover focus-visible:shadow-focus rounded-pill cursor-pointer px-1 font-medium"
            onClick={() => {
              setFailedCount(0);
              setResetKey((k) => k + 1);
            }}
          >
            통계 다시 불러오기
          </button>
        </div>
      )}
      {/* 정본: StatCard 4열 그리드 gap 12 (wf-s2-core ScreenDashboard) */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {CARD_CONFIGS.map((config) => (
          <ErrorBoundary
            key={config.label}
            resetKeys={[resetKey]}
            onError={() => {
              setFailedCount((c) => c + 1);
            }}
            fallbackRender={() => <StatsFallback config={config} />}
          >
            <Suspense fallback={<StatsSkeleton />}>
              <SingleStatCard config={config} />
            </Suspense>
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
}
