import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { MonoLabel } from '@shared/ui/Label';
import { Tag } from '@shared/ui/Tag';

type Feature = {
  glyph: string;
  title: string;
  body: string;
};

type Metric = {
  value: string;
  label: string;
};

const FEATURES: readonly Feature[] = [
  {
    glyph: '◎',
    title: '아바타 매칭',
    body: '다양한 아바타와 대화할 수 있어요.',
  },
  {
    glyph: '⚡',
    title: '답답해? 직접 뛰어!',
    body: '프롬프트를 직접 입력해서\n중요한 순간에 개입할 수 있습니다.',
  },
  {
    glyph: '◈',
    title: '에프터 연결',
    body: '실제 사용자가 궁금하신가요?\n서로의 마음이 맞으면\n대화할 수 있어요.',
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
          <span className="font-ui text-heading text-brand tracking-tight">Avating</span>
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
        <section className="mx-auto flex max-w-[1152px] flex-col px-8 py-16 select-none">
          <div className="mb-5">
            <Tag variant="brand">BETA · 인터랙티브 소셜 게임</Tag>
          </div>

          <h1 className="font-ui text-display text-text">
            귀찮은 밀당은 아바타가,
            <br />
            결정은 당신이.
          </h1>
          <p className="font-ui text-body text-text-2 mt-4 max-w-[640px]">
            AI 아바타를 소개팅에 매칭하고, 관전하고,
            <br />
            결정적인 순간에만 개입하세요.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="p-6">
                <div className="text-title text-brand" aria-hidden="true">
                  {feature.glyph}
                </div>
                <div className="font-ui text-heading text-text mt-4">{feature.title}</div>
                <p className="text-body-sm text-text-2 mt-2 whitespace-pre-line">{feature.body}</p>
              </Card>
            ))}
          </div>

          <Card
            elevation={2}
            className="mt-6 flex flex-col items-stretch gap-6 px-6 py-5 sm:flex-row sm:items-center sm:justify-around sm:gap-4"
          >
            {METRICS.map((metric) => (
              <div key={metric.label} className="flex flex-col items-center text-center">
                <div className="font-ui text-title text-text">{metric.value}</div>
                <MonoLabel className="mt-1">{metric.label}</MonoLabel>
              </div>
            ))}
          </Card>

          <div className="mt-10 flex items-stretch gap-3">
            <Button
              size="md"
              className="flex-[2]"
              onClick={() => {
                void navigate('/signup');
              }}
            >
              회원가입 →
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => {
                void navigate('/login');
              }}
            >
              로그인
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
