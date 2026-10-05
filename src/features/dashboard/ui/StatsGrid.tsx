import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Send, Heart, Users } from 'lucide-react';
import { StatsCard, STATS_CARD_BOX } from '@shared/ui/StatsCard';
import { cn } from '@shared/lib/cn';
import { useLoadErrorFallback } from '@shared/lib/useLoadErrorFallback';
import { useDashboardStats } from '../api/useDashboardStats';
import type { DashboardStats } from '@entities/dashboard';

// StatsCard 와 **같은 상자**(STATS_CARD_BOX)에 **같은 줄상자**를 세운다.
// 치수를 따로 적으면 갈린다 — 실제로 p-3.5 vs p-5 로 갈려 도착 시 카드가 32px 늘어났다.
// 자리표시자 높이는 `&nbsp;` + 실제 타입 클래스로 만들어 토큰에서 파생되게 둔다.
function StatsSkeleton() {
  return (
    <div aria-hidden="true" className={cn(STATS_CARD_BOX, 'animate-pulse')}>
      <div className="flex items-center gap-2">
        <div className="bg-raised rounded-chip size-[13px] shrink-0" />
        <div className="text-caption bg-raised rounded-chip w-16">&nbsp;</div>
      </div>
      <div className="text-figure bg-raised rounded-chip w-20 font-bold">&nbsp;</div>
      <div className="bg-raised rounded-chip h-5 w-24" />
    </div>
  );
}

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

function StatsLoadErrorToast() {
  useLoadErrorFallback('통계를 불러오지 못했어요');
  return null;
}

export function StatsGrid() {
  // 카드 세 장이 같은 조회를 나눠 쓰고 경계는 카드마다 따로라, 토스트는 묶음에서 한 번만 띄운다.
  const [failed, setFailed] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {failed && <StatsLoadErrorToast />}
      {CARD_CONFIGS.map((config) => (
        <ErrorBoundary
          key={config.label}
          onError={() => {
            setFailed(true);
          }}
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
