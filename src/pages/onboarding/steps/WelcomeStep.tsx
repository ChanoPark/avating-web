import { useId } from 'react';
import { useNavigate } from 'react-router';
import { Check, Clock, MessageCircle, SquarePen, type LucideIcon } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';
import { Tag } from '@shared/ui/Tag/Tag';
import { cn } from '@shared/lib/cn';
import {
  resolveResumeRoute,
  setOnboardingMethod,
  setOnboardingProgress,
  type OnboardingMethod,
} from '@entities/onboarding';
import { useOnboardingCompletion } from '@entities/onboarding/api/useOnboardingCompletion';
import { WIZARD_BODY_FLAT, WIZARD_HEAD } from '@shared/ui/wizard';

// S-02-01 환영 — 레일 없는 플랫 형태. 와이어프레임 v2.5 에서 재설계됐다.
// 정본: .claude/design/2026-08-18-wireframe-v2.5/wf/wf-s1-entry.jsx `ScreenOnbWelcome` · `ONB_METHODS`
// + v2.6 델타(.claude/design/2026-08-21-wireframe-v2.6/IMPORT.md).
// 생성 방법을 카드 3장으로 고르게 하고, 앞으로 할 일 예고는 그 아래 인셋 카드로 내려간다.
// v2.6 에서 별도 방법 선택 화면(구 Step 2)이 삭제돼 **방법을 고르는 자리는 여기뿐**이다 —
// 카드를 누르면 method 를 저장하고 Step 1(이름·설명)로 간다.

type MethodCard = {
  /**
   * 플로우에 연결되는 방법만 값을 갖는다. `null` 은 정본에 진입 카드만 있고
   * 목적지 화면·데이터 계약이 없는 방법이다 (아래 프롬프트 항목 주석 참고).
   */
  method: OnboardingMethod | null;
  icon: LucideIcon;
  time: string;
  title: string;
  desc: string;
  cta: string;
};

const METHODS: readonly MethodCard[] = [
  {
    method: 'survey',
    icon: Check,
    time: '약 2분',
    title: '성향 설문으로 아바타 만들기',
    desc: '성향 분석을 통해 자신만의 아바타를 만들어보세요.',
    cta: '설문으로 만들기',
  },
  {
    method: 'connect',
    icon: MessageCircle,
    time: '약 10분',
    title: 'ChatGPT Bot과 대화해서 아바타 만들기',
    desc: 'ChatGPT에서 Bot과의 대화를 통해 자신의 성향을 알아보세요',
    cta: 'Bot과 대화해서 만들기',
  },
  {
    // spec-gap — 정본(Claude Design v2.5)에 이 카드만 있고 그 다음이 없다.
    // `wf/wf-spec.jsx` SPEC_SCREENS 41개에 프롬프트 방식 화면이 없고, S-02-03(생성 방법 선택)은
    // 여전히 설문·Bot 2택이며, 서버 계약의 OnboardingMethod 도 둘뿐이다.
    // 2026-08-18 사용자 결정: 카드는 정본대로 그리되 플로우에는 연결하지 않는다.
    // 목적지를 추측해 잇는 것도, '준비중' 문구나 disabled 를 지어내는 것도 창작이라 하지 않는다.
    // 사양이 오면 method 를 채우는 것만으로 연결된다. 회귀 방지는 WelcomeStep.test.tsx 가 맡는다.
    method: null,
    icon: SquarePen,
    time: '약 5분',
    title: '프롬프트를 복사해서 아바타 만들기',
    desc: '평소 쓰는 AI에 프롬프트를 붙여넣고, 나온 결과를 다시 가져오세요.',
    cta: '프롬프트 복사하기',
  },
];

// 앞으로 할 일 3단계. 스텝 레일 라벨(`ONBOARDING_FALLBACK_LABELS`)과는 다른 계열이라
// 그 상수로 대체하지 않는다 — 정본이 두 곳에서 서로 다른 문구를 쓴다.
//
// 정본(`wf-s1-entry.jsx`)의 리스트는 아직 '생성 방법 선택' 을 포함한 4항목이라 같은 화면의
// 각주("아래 3단계")·레일(3단계)과 숫자가 어긋난다. 게다가 그 항목은 이제 이 화면에서 하는 일이다.
// 2026-08-21 사용자 결정으로 3항목이 정답이다 (.claude/design/2026-08-21-wireframe-v2.6/IMPORT.md).
const TASKS = ['기본 정보 입력', '성향 분석 (설문 · Bot 대화 · 프롬프트)', '아바타 확인'] as const;

export function WelcomeStep() {
  const navigate = useNavigate();
  const titleIdPrefix = useId();
  // 처음이 아니면 멈춘 자리에서 이어간다. 판정이 아직이면 미완료 쪽으로 떨어져
  // 온보딩을 계속할 수 있고, 다음 화면의 가드가 스스로 바로잡는다.
  const { hasPrimaryAvatar } = useOnboardingCompletion();

  const handleStart = (method: OnboardingMethod) => {
    setOnboardingMethod(method);
    setOnboardingProgress('intro');
    void navigate(resolveResumeRoute(hasPrimaryAvatar));
  };

  return (
    <div className={WIZARD_BODY_FLAT}>
      <div className={WIZARD_HEAD}>
        <h1 className="text-heading-lg text-ink text-balance">
          환영해요, 이제 아바타를 만들 차례예요
        </h1>
        <p className="text-body-sm text-ink-mute text-pretty">
          아바타를 만드는 방법은 세 가지예요. 원하는 방법을 골라 시작하세요.
        </p>
      </div>

      {/* 정본은 1440 데스크톱 전용이라 3열 고정이다. 좁은 폭은 세로로 쌓는다 (§4 기본기). */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        {METHODS.map(({ method, icon: MethodIcon, time, title, desc, cta }, index) => {
          const titleId = `${titleIdPrefix}-method-${String(index)}`;
          // 세 카드는 시각적으로 동등하다. 2026-08-18 사용자 지시로 첫 카드 강조를 뺐고,
          // v2.6 에서 정본도 같아졌다 — 더는 divergence 가 아니다.
          // shared `Card` 를 쓰지 않는 이유는 정본 `.av-card` 에 그림자가 없어서다
          // (`--featured`·`--elevated` 만 갖는다).
          return (
            <div
              key={title}
              role="group"
              aria-labelledby={titleId}
              className="bg-surface border-hairline flex flex-1 flex-col gap-3 rounded-lg border p-[18px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  aria-hidden="true"
                  className="bg-primary-wash text-primary-press flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                >
                  <MethodIcon size={15} strokeWidth={1.5} />
                </span>
                <Tag variant="neutral" className="tnum">
                  <Clock size={11} strokeWidth={1.5} aria-hidden="true" />
                  {time}
                </Tag>
              </div>

              <div className="flex flex-col gap-[5px]">
                <h2 id={titleId} className="text-heading-sm text-ink text-balance">
                  {title}
                </h2>
                <p className="text-caption text-ink-mute text-pretty">{desc}</p>
              </div>

              <Button
                block
                className="mt-auto"
                {...(method !== null
                  ? {
                      onClick: () => {
                        handleStart(method);
                      },
                    }
                  : {})}
              >
                {/* 2026-08-18 사용자 지시로 화살표를 뺐고, v2.6 에서 정본도 같아졌다. */}
                {cta}
              </Button>
            </div>
          );
        })}
      </div>

      {/* `Card soft` — 캔버스 인셋이라 서피스 카드와 달리 테두리·그림자가 없다
          (`.av-card--soft`: background `--canvas-soft`, border-color transparent). */}
      <div className="bg-canvas-soft rounded-lg px-3.5 py-1">
        <ol className="flex flex-col">
          {TASKS.map((task, index) => {
            // 전부 미완료 상태 — 첫 항목만 active.
            const isActive = index === 0;
            return (
              <li
                key={task}
                className={cn(
                  'flex items-center gap-3 py-[9px] text-[13px]',
                  isActive ? 'text-ink font-medium' : 'text-ink-mute'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'text-micro tnum flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
                    isActive ? 'border-primary text-primary' : 'border-hairline-input'
                  )}
                >
                  {index + 1}
                </span>
                {task}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
