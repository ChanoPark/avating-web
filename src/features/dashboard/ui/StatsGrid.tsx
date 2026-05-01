import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { Send, Heart, Sparkles, Zap } from 'lucide-react';
import { StatsCard } from '@shared/ui/StatsCard';
import { useDashboardStats } from '../api/useDashboardStats';
import type { DashboardStats } from '@entities/dashboard';

function StatsSkeleton() {
  return (
    <div className="border-border bg-bg-elev-2 animate-pulse rounded-md border p-5">
      <div className="bg-bg-elev-3 h-3 w-16 rounded" />
    </div>
  );
}

function StatsFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="border-border bg-bg-elev-2 rounded-md border p-5">
      <div className="text-text-3 text-mono-meta font-mono">—</div>
      <button
        type="button"
        className="text-body-sm text-brand mt-2 underline"
        onClick={resetErrorBoundary}
      >
        재시도
      </button>
    </div>
  );
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
    label: '에프터 연결',
    Icon: Sparkles,
    getValue: (s) => String(s.matches),
    getDelta: (s) => ({
      text: `매칭 성공률 ${s.matchRate.toFixed(1)}%`,
      tone: 'neutral',
    }),
    getAriaLabel: (s) => `에프터 연결 ${s.matches}건, 매칭 성공률 ${s.matchRate.toFixed(1)}%`,
  },
  {
    label: '이번 주 훈수',
    Icon: Zap,
    getValue: (s) => String(s.interventionsThisWeek),
    getDelta: (s) => ({
      text: `-${s.gemsUsed} 다이아 사용`,
      tone: 'negative',
    }),
    getAriaLabel: (s) => `이번 주 훈수 ${s.interventionsThisWeek}회, ${s.gemsUsed} 다이아 사용`,
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
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {CARD_CONFIGS.map((config) => (
        <ErrorBoundary key={config.label} fallbackRender={(props) => <StatsFallback {...props} />}>
          <Suspense fallback={<StatsSkeleton />}>
            <SingleStatCard config={config} />
          </Suspense>
        </ErrorBoundary>
      ))}
    </div>
  );
}
