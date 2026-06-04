import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/Button/Button';
import { setOnboardingMethod, setOnboardingProgress } from '@entities/onboarding';

// 와이어프레임 v2: 단계 미리보기를 제거한 브랜드 환영 모멘트.
// "아바타 만들기"는 Step 1(이름·설명)로, "Bot 연동"은 동일 흐름에 method=connect 를 사전 선택해 진입한다.
const TIME_HINTS = [
  { title: '성향 설문', time: '약 2분' },
  { title: '아바타 확인', time: '약 1분' },
] as const;

export function WelcomeStep() {
  const navigate = useNavigate();

  const handleStart = () => {
    setOnboardingProgress('intro');
    void navigate('/onboarding/intro');
  };

  const handleBotConnect = () => {
    setOnboardingMethod('connect');
    setOnboardingProgress('intro');
    void navigate('/onboarding/intro');
  };

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-6 px-4 py-12 text-center">
      <div
        aria-hidden="true"
        className="bg-brand-soft border-brand-border flex h-[52px] w-[52px] items-center justify-center rounded-xl border"
      >
        <span className="font-ui text-title text-brand font-semibold">Av</span>
      </div>

      <h1 className="font-ui text-title text-text leading-snug whitespace-pre-line">
        {'환영해요,\n이제 아바타를 만들 차례예요'}
      </h1>

      <p className="text-body text-text-2 leading-relaxed">
        2분이면 충분해요. 내 성향을 분석해 AI 아바타를 만들고 첫 번째 매칭을 시작할 수 있어요.
      </p>

      <div className="flex items-center justify-center gap-8">
        {TIME_HINTS.map((hint) => (
          <div key={hint.title} className="flex flex-col items-center gap-0.5">
            <span className="font-ui text-subheading text-text">{hint.title}</span>
            <span className="text-mono-meta text-brand font-mono">{hint.time}</span>
          </div>
        ))}
      </div>

      <Button type="button" className="w-full" onClick={handleStart}>
        아바타 만들기 →
      </Button>

      <p className="text-body-sm text-text-3">
        이미 ChatGPT Bot이 있어요?{' '}
        <button
          type="button"
          onClick={handleBotConnect}
          className="text-brand hover:text-brand-hover underline-offset-2 hover:underline"
        >
          Bot 연동
        </button>
      </p>
    </div>
  );
}
