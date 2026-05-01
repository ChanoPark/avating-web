import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { MonoLabel } from '@shared/ui/Label';
import { Tag } from '@shared/ui/Tag';

const FEATURES = [
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
    body: '실제 사용자가 궁금하신가요?\n서로의 마음이 맞으면 대화할 수 있어요.',
  },
] as const;

const METRICS = [
  { value: '4.2만+', label: '누적 매칭' },
  { value: '68%', label: '평균 호감도' },
  { value: '1.1만', label: '에프터 연결' },
] as const;

export function ServiceIntroPage() {
  const navigate = useNavigate();

  return (
    <main className="bg-bg text-text min-h-screen">
      <header className="border-border bg-bg-elev-1 border-b">
        <div className="mx-auto flex h-14 max-w-[1152px] items-center justify-between px-8">
          <span className="font-ui text-heading text-text tracking-tight">Avating</span>
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

      <section className="mx-auto max-w-[1152px] px-8 py-16">
        <div className="mb-6">
          <Tag variant="brand">BETA · 인터랙티브 소셜 게임</Tag>
        </div>

        <h1 className="text-display text-text select-none">
          귀찮은 밀당은 아바타가,
          <br />
          결정은 당신이.
        </h1>
        <p className="text-body text-text-2 mt-6 max-w-[640px] select-none">
          AI 아바타를 소개팅에 파견하고, 관전하고,
          <br />
          결정적인 순간에만 개입하세요.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 select-none md:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="p-6">
              <div className="text-title text-brand font-mono">{feature.glyph}</div>
              <div className="text-heading text-text mt-4">{feature.title}</div>
              <p className="text-body-sm text-text-2 mt-2 whitespace-pre-line">{feature.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 select-none">
          {METRICS.map((metric) => (
            <Card key={metric.label} elevation={2} className="p-5">
              <MonoLabel>{metric.label}</MonoLabel>
              <div className="text-title text-text mt-2">{metric.value}</div>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Button
            size="md"
            onClick={() => {
              void navigate('/signup');
            }}
          >
            가입하기 →
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              void navigate('/login');
            }}
          >
            로그인
          </Button>
        </div>
      </section>
    </main>
  );
}
