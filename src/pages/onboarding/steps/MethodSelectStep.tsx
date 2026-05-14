import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/Button/Button';
import { Tag } from '@shared/ui/Tag/Tag';
import {
  getOnboardingMethod,
  getOnboardingProgress,
  setOnboardingMethod,
  setOnboardingProgress,
  type OnboardingMethod,
} from '@entities/onboarding';

type MethodCardProps = {
  selected: boolean;
  glyph: string;
  title: string;
  duration: string;
  description: string;
  tag?: string;
  onSelect: () => void;
  inputId: string;
};

function MethodCard({
  selected,
  glyph,
  title,
  duration,
  description,
  tag,
  onSelect,
  inputId,
}: MethodCardProps) {
  return (
    <label
      htmlFor={inputId}
      className={`focus-within:ring-brand relative flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors focus-within:ring-2 ${
        selected
          ? 'border-brand-border bg-brand-soft'
          : 'border-border bg-bg-elev-2 hover:border-border-hi'
      }`}
    >
      <input
        type="radio"
        id={inputId}
        name="avatar-creation-method"
        value={inputId}
        checked={selected}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-base ${
          selected
            ? 'bg-brand-soft border-brand-border text-brand'
            : 'bg-bg-elev-3 border-border text-text-3'
        }`}
      >
        {glyph}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`font-ui text-subheading ${selected ? 'text-brand' : 'text-text'}`}>
            {title}
          </span>
          <span className="text-mono-meta text-text-3 font-mono">{duration}</span>
        </div>
        <p className="text-body-sm text-text-2 whitespace-pre-line">{description}</p>
        {tag !== undefined && (
          <div className="mt-1">
            <Tag variant="brand">{tag}</Tag>
          </div>
        )}
      </div>
      <span
        aria-hidden="true"
        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-brand bg-brand' : 'border-border-hi'
        }`}
      >
        {selected && <span className="bg-bg block h-1.5 w-1.5 rounded-full" />}
      </span>
    </label>
  );
}

export function MethodSelectStep() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<OnboardingMethod>(() => getOnboardingMethod() ?? 'survey');

  useEffect(() => {
    const progress = getOnboardingProgress();
    if (progress === 'welcome') {
      void navigate('/onboarding/welcome', { replace: true });
      return;
    }
    if (progress === 'complete') {
      void navigate('/onboarding/complete', { replace: true });
      return;
    }
    if (progress === 'creating') {
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
  }, [navigate]);

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
    void navigate('/onboarding/welcome');
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6 py-6">
      <header className="flex flex-col gap-1">
        <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
          STEP 2 / 4 · 아바타 생성 방법
        </span>
        <h1 className="font-ui text-title text-text">어떻게 아바타를 만들까요?</h1>
        <p className="text-body-sm text-text-3">하나를 선택하면 변경할 수 없습니다</p>
      </header>

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">아바타 생성 방법 선택</legend>

        <MethodCard
          inputId="method-survey"
          selected={method === 'survey'}
          glyph="◎"
          title="성향 설문"
          duration="약 2분"
          description={'6가지 질문으로 성향을 분석합니다.\n빠르고 간단합니다.'}
          onSelect={() => {
            setMethod('survey');
          }}
        />

        <MethodCard
          inputId="method-connect"
          selected={method === 'connect'}
          glyph="◷"
          title="ChatGPT Bot 연동"
          duration="약 10분"
          description={'Custom GPT와 대화해 더 정밀한\n아바타를 만듭니다.'}
          tag="정확도 높음"
          onSelect={() => {
            setMethod('connect');
          }}
        />

        <div
          role="note"
          className="border-border bg-bg-elev-2 flex items-start gap-2 rounded-sm border p-3"
        >
          <span className="text-warning mt-px text-base" aria-hidden="true">
            !
          </span>
          <p className="text-body-sm text-text-2">
            생성된 아바타는 기본적으로 수정할 수 없습니다. 이후 튜닝 기능을 통해 조정할 수 있습니다.
          </p>
        </div>
      </fieldset>

      <div className="mt-2 flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={handlePrev}>
          ← 이전
        </Button>
        <Button type="button" onClick={handleNext}>
          다음 →
        </Button>
      </div>
    </div>
  );
}
