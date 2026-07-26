import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Tag } from '@shared/ui/Tag';

type Step = {
  title: string;
  body: string;
};

// 정본 `ScreenServiceIntro` 의 HOW IT WORKS 3카드.
const STEPS: readonly Step[] = [
  { title: '아바타를 만들어요', body: '설문 6문항 또는 ChatGPT Bot 연동' },
  { title: '아바타끼리 대화해요', body: '관전하며 훈수로 개입' },
  { title: '호감도가 넘으면 연결', body: '양측 수락 시 실제 채팅 개설' },
];

// 아직 화면이 없는 마케팅 내비·푸터 항목은 링크를 만들지 않고 비대화형 텍스트로 둔다
// (죽은 링크에 포커스가 잡히지 않게 — AppShellLayout 의 비활성 내비와 같은 판단).
const NAV_ITEMS = ['서비스 소개', '작동 방식', '요금'] as const;
const FOOTER_ITEMS = ['이용약관', '개인정보', '문의'] as const;

const HOW_IT_WORKS_ID = 'how-it-works';

// 로고 마크 = 정사각 size, radius = size × 0.28, `--primary` 채움.
// 워드마크 = size × 0.78, weight 500, letterSpacing -0.4px (LAYOUT-NUMBERS § 카드 · 데이터 부품).
function Logo({ size }: { size: number }) {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="bg-primary shrink-0"
        style={{ width: size, height: size, borderRadius: size * 0.28 }}
      />
      <span className="text-ink font-medium tracking-[-0.4px]" style={{ fontSize: size * 0.78 }}>
        Avating
      </span>
    </span>
  );
}

export function ServiceIntroPage() {
  const navigate = useNavigate();

  // 아직 별도 라우트가 없는 "작동 방식" 은 같은 화면의 HOW IT WORKS 밴드로만 이동시킨다.
  const scrollToHowItWorks = () => {
    document.getElementById(HOW_IT_WORKS_ID)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-canvas text-ink flex min-h-screen flex-col">
      {/* 히어로 밴드 — `--grad-brand`(흰→#f1f3f6) 는 이 화면에서만 허용된다. */}
      <div className="bg-[image:var(--grad-brand)]">
        {/* 마케팅 상단 바 — height 68, padding 0 64px, 하단 hairline */}
        <header className="border-hairline flex h-[68px] items-center justify-between gap-4 border-b px-6 lg:px-16">
          <Logo size={19} />

          <div className="text-body-sm hidden items-center gap-[18px] lg:flex">
            {NAV_ITEMS.map((item, index) => (
              <span key={item} className={index === 0 ? 'text-ink' : 'text-ink-mute'}>
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigate('/login');
              }}
            >
              로그인
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void navigate('/signup');
              }}
            >
              회원가입
            </Button>
          </div>
        </header>

        {/* 히어로 — padding 64px 64px 78px, gap 56, 좌 flex 0 0 44% / 우 flex 1 */}
        <div className="flex flex-col items-center gap-14 px-6 pt-16 pb-19.5 lg:flex-row lg:px-16">
          <div className="flex w-full min-w-0 flex-col gap-5 lg:flex-[0_0_44%]">
            <Tag className="self-start">BETA · 인터랙티브 소셜 게임</Tag>

            <h1 className="text-display-lg text-ink text-balance">
              귀찮은 밀당은 아바타가,
              <br />
              결정은 당신이.
            </h1>

            <p className="text-body text-ink-mute text-pretty">
              나를 닮은 AI 아바타가 먼저 대화를 나눕니다. 당신은 관전하다가 결정적인 순간에만
              개입하면 돼요.
            </p>

            <div className="mt-1 flex flex-wrap gap-2.5">
              <Button
                onClick={() => {
                  void navigate('/signup');
                }}
              >
                무료로 시작하기
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </Button>
              <Button variant="ghost" onClick={scrollToHowItWorks}>
                작동 방식 보기
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* 제품 목업 — 흰 서피스 + hairline + radius 14 + padding 10 + shadow-lift */}
          <div className="border-hairline bg-surface shadow-lift w-full min-w-0 rounded-[14px] border p-2.5 lg:flex-1">
            <div
              aria-hidden="true"
              className="bg-canvas-soft text-ink-mute text-caption flex h-[330px] items-center justify-center rounded-md"
            >
              시뮬레이션 관전 화면
            </div>
          </div>
        </div>
      </div>

      <main className="flex flex-1 flex-col">
        {/* HOW IT WORKS — padding 40px 64px 36px, gap 18 */}
        <section
          id={HOW_IT_WORKS_ID}
          aria-labelledby="how-it-works-eyebrow"
          className="flex flex-col gap-4.5 px-6 pt-10 pb-9 lg:px-16"
        >
          <h2 id="how-it-works-eyebrow" className="text-micro-cap text-ink-mute uppercase">
            HOW IT WORKS
          </h2>

          <div className="grid gap-4.5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Card key={step.title} className="flex flex-col gap-1.5 p-4.5">
                <span className="text-micro-cap text-primary tnum uppercase">{`0${String(index + 1)}`}</span>
                <div className="text-heading-sm text-ink">{step.title}</div>
                <p className="text-caption text-ink-mute tnum text-pretty">{step.body}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* 푸터 — height 60, padding 0 64px, 상단 hairline, bg-surface */}
      <footer className="border-hairline bg-surface flex h-[60px] shrink-0 items-center justify-between gap-4 border-t px-6 lg:px-16">
        <Logo size={16} />
        <div className="text-ink-mute flex items-center gap-4 text-[12px]">
          {FOOTER_ITEMS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
