import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Tag } from '@shared/ui/Tag';
import { HOW_IT_WORKS_ID, SERVICE_INTRO_HERO_ID, SiteHeader } from '@features/auth/ui/SiteHeader';
import { useAuthStore } from '@entities/auth/store';
import { useOnboardingCompletion } from '@entities/onboarding/api/useOnboardingCompletion';

type Step = {
  title: string;
  body: string;
};

const STEPS: readonly Step[] = [
  // 총 문항 수는 서버 시딩(지표 7종 × questionCount)에 따라 달라진다 — 문구에 숫자를 박지 않는다.
  { title: '아바타를 만들어요', body: '성향 설문 또는 ChatGPT Bot 연동' },
  { title: '아바타끼리 대화해요', body: '관전하며 훈수로 개입' },
  { title: '호감도가 넘으면 연결', body: '양측 수락 시 실제 채팅 개설' },
];

const FOOTER_ITEMS = ['이용약관', '개인정보', '문의'] as const;

// 아직 별도 라우트가 없는 마케팅 내비는 같은 화면의 밴드로만 이동시킨다.
function scrollToSection(targetId: string) {
  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
}

export function ServiceIntroPage() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const status = useAuthStore((s) => s.status);

  // 로그인한 사용자를 가입·로그인 폼으로 되돌려보내면 세션이 풀린 것처럼 보이므로 "시작하기" 하나로 접는다.
  const isAuthenticated = status === 'authenticated';

  // 비로그인 방문자에게 조회가 나가면 토큰 없이 401 을 받아 refresh 인터셉터가 돌고 세션이 정리된다.
  const { hasPrimaryAvatar, isResolved, isUnknown } = useOnboardingCompletion({
    enabled: isAuthenticated,
  });

  // 판정 전(isResolved=false)이나 조회 실패(isUnknown)까지 미완료로 취급하면, 서버가 잠깐
  // 흔들린 것만으로 온보딩을 마친 회원이 다시 온보딩으로 튕겨 나간다 — 근거가 없으면 대시보드가 기본값이다.
  const needsOnboarding = isResolved && !isUnknown && !hasPrimaryAvatar;

  // `/onboarding` 진입 화면이 재개 위치를 스스로 정하므로, 여기서 resolveResumeRoute 를
  // 다시 부르면 아직 방법을 고르지 않은 사용자를 건너뛰게 된다.
  const enterService = () => {
    void navigate(needsOnboarding ? '/onboarding' : '/dashboard');
  };
  const goSignup = () => {
    void navigate('/signup');
  };

  const scrollToHowItWorks = () => {
    scrollToSection(HOW_IT_WORKS_ID);
  };

  // 가입 화면 헤더의 내비는 `/#<밴드 id>` 로 넘어온다 — 도착하면 그 밴드로 내려준다.
  useEffect(() => {
    if (hash !== '') scrollToSection(hash.slice(1));
  }, [hash]);

  return (
    <div className="bg-canvas text-primary flex min-h-screen flex-col">
      <div id={SERVICE_INTRO_HERO_ID} className="bg-canvas">
        <SiteHeader
          onNavigate={scrollToSection}
          onStart={isAuthenticated ? enterService : undefined}
        />

        <div className="flex flex-col items-center gap-14 px-6 pt-16 pb-19.5 lg:flex-row lg:px-16">
          <div className="flex w-full min-w-0 flex-col gap-5 lg:flex-[0_0_44%]">
            <Tag className="self-start">BETA · 인터랙티브 소셜 게임</Tag>

            {/* 정본 `.ent-h1{line-height:1.25}` — text-figure 의 --lh-flat(1) 은 한 줄 숫자용이라
                2줄 헤드라인에서 줄이 서로 붙는다. */}
            <h1 className="text-figure text-ink leading-[1.25] text-balance">
              귀찮은 밀당은 아바타가,
              <br />
              결정은 당신이.
            </h1>

            <p className="text-body text-secondary text-pretty">
              나를 닮은 AI 아바타가 먼저 대화를 나눕니다. 당신은 관전하다가 결정적인 순간에만
              개입하면 돼요.
            </p>

            <div className="mt-1 flex flex-wrap gap-2.5">
              <Button onClick={isAuthenticated ? enterService : goSignup}>
                무료로 시작하기
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </Button>
              <Button variant="ghost" onClick={scrollToHowItWorks}>
                작동 방식 보기
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="border-subtle bg-canvas w-full min-w-0 rounded-[14px] border p-2.5 lg:flex-1">
            <div
              aria-hidden="true"
              className="bg-surface text-secondary text-caption rounded-card flex h-[330px] items-center justify-center"
            >
              시뮬레이션 관전 화면
            </div>
          </div>
        </div>
      </div>

      <main className="flex flex-1 flex-col">
        <section
          id={HOW_IT_WORKS_ID}
          aria-labelledby="how-it-works-eyebrow"
          className="flex flex-col gap-4.5 px-6 pt-10 pb-9 lg:px-16"
        >
          <h2 id="how-it-works-eyebrow" className="text-label text-secondary uppercase">
            HOW IT WORKS
          </h2>

          <div className="grid gap-4.5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Card key={step.title} onWhite className="flex flex-col gap-1.5">
                <span className="text-label text-action tnum uppercase">{`0${String(index + 1)}`}</span>
                <div className="text-lead text-primary">{step.title}</div>
                <p className="text-caption text-secondary tnum text-pretty">{step.body}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* 정본은 좌측에 로고를 두지만, 상단 바 로고와 중복돼 두지 않는다. */}
      <footer className="border-subtle bg-canvas flex h-[60px] shrink-0 items-center justify-end gap-4 border-t px-6 lg:px-16">
        <div className="text-secondary flex items-center gap-4 text-[12px]">
          {FOOTER_ITEMS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
