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

// 방법을 고르는 자리는 여기뿐이다 — 카드를 누르면 method 를 저장하고 Step 1(이름·설명)로 간다.

type MethodCard = {
  /** `null` 은 정본에 카드만 있고 목적지·데이터 계약이 없는 방법이다(아래 프롬프트 카드 참고). */
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
    // spec-gap — 목적지 화면·데이터 계약이 없어 연결하지 않는다.
    // 라우트를 추측해 잇거나 '준비중' 문구·disabled 를 지어내지 않는다 — 사양이 오면 method 만 채운다.
    method: null,
    icon: SquarePen,
    time: '약 5분',
    title: '프롬프트를 복사해서 아바타 만들기',
    desc: '평소 쓰는 AI에 프롬프트를 붙여넣고, 나온 결과를 다시 가져오세요.',
    cta: '프롬프트 복사하기',
  },
];

// ONBOARDING_FALLBACK_LABELS(스텝 레일 라벨)와는 다른 문구 계열이라 재사용하지 않는다.
// 정본은 '생성 방법 선택'을 포함한 4항목이지만, 그 항목이 이 화면의 카드라 3항목이 맞다.
const TASKS = ['기본 정보 입력', '성향 분석 (설문 · Bot 대화 · 프롬프트)', '아바타 확인'] as const;

export function WelcomeStep() {
  const navigate = useNavigate();
  const titleIdPrefix = useId();
  // 판정이 아직이면 미완료로 간주해 온보딩을 계속하게 하고, 다음 화면의 가드가 스스로 바로잡는다.
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

      {/* 정본은 데스크톱 전용 3열이라, 좁은 폭에서는 세로로 쌓는다. */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        {METHODS.map(({ method, icon: MethodIcon, time, title, desc, cta }, index) => {
          const titleId = `${titleIdPrefix}-method-${String(index)}`;
          // 세 카드는 동등하게 강조 없이 그린다. 정본 `.av-card` 에는 그림자가 없어 shared `Card` 를 쓰지 않는다.
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
                {/* 카드 CTA 에는 화살표 아이콘을 두지 않는다. */}
                {cta}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="bg-canvas-soft rounded-lg px-3.5 py-1">
        <ol className="flex flex-col">
          {TASKS.map((task, index) => {
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
