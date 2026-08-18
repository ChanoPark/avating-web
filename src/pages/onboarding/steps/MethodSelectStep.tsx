import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, CircleAlert } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';
import { cn } from '@shared/lib/cn';
import {
  getOnboardingMethod,
  getOnboardingProgress,
  setOnboardingMethod,
  setOnboardingProgress,
  type OnboardingMethod,
} from '@entities/onboarding';
import { useOnboardingCompletion } from '@entities/onboarding/api/useOnboardingCompletion';
import { WIZARD_ACTIONS, WIZARD_BODY, WIZARD_HEAD } from '@shared/ui/wizard';

type MethodCardProps = {
  selected: boolean;
  title: string;
  meta: string;
  description: string;
  onSelect: () => void;
  inputId: string;
};

// v2.1 Breaking — 선택 상태는 틴트 채움이 아니라 흰 서피스 + `border-primary` 다.
function MethodCard({ selected, title, meta, description, onSelect, inputId }: MethodCardProps) {
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'bg-surface flex cursor-pointer items-start gap-3 rounded-md border p-3.5',
        'ease-brand transition-colors duration-[var(--dur-fast)] focus-within:shadow-[var(--focus-ring)]',
        selected ? 'border-primary' : 'border-hairline hover:border-hairline-input'
      )}
    >
      <input
        type="radio"
        id={inputId}
        name="avatar-creation-method"
        value={inputId}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
          selected ? 'border-primary' : 'border-hairline-input'
        )}
      >
        {selected && <span className="bg-primary block h-2 w-2 rounded-full" />}
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className={cn('text-body-sm font-medium', selected ? 'text-primary' : 'text-ink')}>
            {title}
          </span>
          <span className="text-micro text-ink-mute tnum">{meta}</span>
        </span>
        <span className="text-caption text-ink-secondary">{description}</span>
      </span>
    </label>
  );
}

export function MethodSelectStep() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<OnboardingMethod>(() => getOnboardingMethod() ?? 'survey');
  const { hasPrimaryAvatar } = useOnboardingCompletion();

  useEffect(() => {
    const progress = getOnboardingProgress();
    if (progress === 'welcome') {
      void navigate('/onboarding/welcome', { replace: true });
      return;
    }
    // 이름·설명(intro) 미완료 상태에서 method 직접 진입 시 Step 1 로 되돌린다.
    if (progress === 'intro') {
      void navigate('/onboarding/intro', { replace: true });
      return;
    }
    if (progress === 'complete' && hasPrimaryAvatar) {
      void navigate('/onboarding/complete', { replace: true });
      return;
    }
    // 진행 기록의 complete 는 완료를 보장하지 않는다 — 아바타 없이도 올라가던 경로가 있었다.
    // 대표 아바타가 없으면 아직 생성 중인 것으로 보고 creating 과 같게 다룬다.
    if (progress === 'creating' || progress === 'complete') {
      const stored = getOnboardingMethod();
      if (stored === 'survey') {
        void navigate('/onboarding/survey', { replace: true });
      } else if (stored === 'connect') {
        void navigate('/onboarding/connect', { replace: true });
      }
      // stored === null: PROGRESS_KEY 가 'creating' 이지만 METHOD_KEY 가 없는 비정상 상태.
      // 일반 플로우로는 도달 불가 (수동 localStorage 조작 시만 발생). 사용자에게 방법을
      // 다시 선택할 기회를 주는 조용한 복구로 처리 — 별도 redirect 없이 화면 표시.
    }
  }, [hasPrimaryAvatar, navigate]);

  const handleNext = () => {
    setOnboardingMethod(method);
    setOnboardingProgress('creating');
    if (method === 'survey') {
      void navigate('/onboarding/survey');
    } else {
      void navigate('/onboarding/connect');
    }
  };

  const handlePrev = () => {
    void navigate('/onboarding/intro');
  };

  return (
    <>
      <div className={WIZARD_BODY}>
        <div className={WIZARD_HEAD}>
          <h1 className="text-heading-lg text-ink">어떻게 아바타를 만들까요?</h1>
          <p className="text-body-sm text-ink-mute">
            선택한 방법으로 성향을 분석해요. 이후 튜닝으로 조정할 수 있습니다.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="sr-only">아바타 생성 방법 선택</legend>

          <MethodCard
            inputId="method-survey"
            selected={method === 'survey'}
            title="성향 설문"
            meta="약 2분"
            description="6가지 질문으로 성향을 분석합니다. 빠르고 간단해요."
            onSelect={() => {
              setMethod('survey');
            }}
          />

          <MethodCard
            inputId="method-connect"
            selected={method === 'connect'}
            title="ChatGPT Bot 연동"
            meta="약 10분"
            description="Custom GPT와 대화해 더 정밀한 아바타를 만듭니다."
            onSelect={() => {
              setMethod('connect');
            }}
          />
        </fieldset>

        {/* 배너 — padding 11px 13px, fontSize 13, 아이콘 16px. */}
        <p className="text-caption text-warning bg-warning-wash flex items-start gap-2 rounded-md px-3.25 py-2.75">
          <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="mt-px shrink-0" />
          생성된 아바타의 스탯은 직접 수정할 수 없어요. 이후 튜닝 기능으로 다듬습니다.
        </p>
      </div>

      <div className={WIZARD_ACTIONS}>
        <Button type="button" variant="ghost" onClick={handlePrev}>
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          이전
        </Button>
        <Button type="button" onClick={handleNext}>
          다음
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    </>
  );
}
