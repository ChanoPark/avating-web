import { useNavigate } from 'react-router';
import { ArrowRight, Heart, Users, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { MonoLabel } from '@shared/ui/Label';
import { Tag } from '@shared/ui/Tag';
import { cn } from '@shared/lib/cn';

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

type Metric = {
  value: string;
  label: string;
};

const FEATURES: readonly Feature[] = [
  {
    icon: Users,
    title: '아바타 매칭',
    body: '내 성향을 학습한 AI 아바타가 다른 아바타와 먼저 대화해요.',
  },
  {
    icon: Zap,
    title: '답답하면 직접 개입',
    body: '결정적인 순간엔 프롬프트를 직접 넣어 대화에 끼어들 수 있어요.',
  },
  {
    icon: Heart,
    title: '에프터 연결',
    body: '서로의 마음이 맞으면 진짜 사용자끼리 대화를 이어가요.',
  },
];

const METRICS: readonly Metric[] = [
  { value: '4.2만+', label: '누적 매칭' },
  { value: '68%', label: '평균 호감도' },
  { value: '1.1만', label: '에프터 연결' },
];

export function ServiceIntroPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-bg text-text flex min-h-screen flex-col">
      <header className="border-border bg-bg-elev-1 sticky top-0 z-[var(--z-sticky)] border-b">
        <div className="mx-auto flex h-14 max-w-[1152px] items-center justify-between px-8">
          <span className="font-ui text-heading text-text flex items-center gap-2.5 tracking-tight">
            <span aria-hidden="true" className="bg-brand h-[22px] w-[22px] rounded-md" />
            Avating
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void navigate('/login');
            }}
          >
            로그인
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-[1152px] px-8 py-16">
          {/* Hero — copy + product preview */}
          <div className="grid grid-cols-1 items-center gap-9 md:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col items-start">
              <Tag variant="brand" className="mb-5">
                BETA · 인터랙티브 소셜 게임
              </Tag>
              <h1 className="font-ui text-display text-text">
                귀찮은 밀당은 아바타가,
                <br />
                결정은 당신이.
              </h1>
              <p className="font-ui text-body text-text-2 mt-4 max-w-[480px]">
                AI 아바타를 소개팅에 매칭하고, 관전하고, 결정적인 순간에만 개입하세요. 내 성향을
                닮은 아바타가 먼저 대화를 시작합니다.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    void navigate('/signup');
                  }}
                >
                  무료로 시작하기
                  <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    void navigate('/login');
                  }}
                >
                  로그인
                </Button>
              </div>
              <div className="text-mono-meta text-text-3 mt-5 flex items-center gap-2 font-mono">
                <span
                  aria-hidden="true"
                  className="bg-success h-1.5 w-1.5 rounded-full motion-safe:animate-pulse"
                />
                가입 후 2분이면 첫 아바타가 완성돼요
              </div>
            </div>

            <div className="flex justify-center">
              <div
                aria-hidden="true"
                className="border-border-hi bg-bg-elev-1 shadow-2 flex aspect-[4/3] w-full max-w-[520px] flex-col overflow-hidden rounded-xl"
              >
                <div className="border-border bg-bg flex h-9 shrink-0 items-center gap-1.5 border-b px-3.5">
                  <span className="bg-bg-elev-3 h-2 w-2 rounded-full" />
                  <span className="bg-bg-elev-3 h-2 w-2 rounded-full" />
                  <span className="bg-bg-elev-3 h-2 w-2 rounded-full" />
                </div>
                <div className="text-text-4 text-body-sm flex flex-1 items-center justify-center text-center font-mono leading-relaxed tracking-wide">
                  매칭 관전 화면
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="p-[22px]">
                <div className="bg-brand-soft border-brand-border text-brand mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-md border">
                  <feature.icon size={20} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="font-ui text-heading text-text">{feature.title}</div>
                <p className="text-body-sm text-text-2 mt-2">{feature.body}</p>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <Card className="mt-6 flex px-7 py-6">
            {METRICS.map((metric, i) => (
              <div
                key={metric.label}
                className={cn('flex-1 text-center', i > 0 && 'border-border border-l')}
              >
                <div className="font-ui text-title text-text">{metric.value}</div>
                <MonoLabel className="mt-1">{metric.label}</MonoLabel>
              </div>
            ))}
          </Card>
        </section>
      </main>
    </div>
  );
}
