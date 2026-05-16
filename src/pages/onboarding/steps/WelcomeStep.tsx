import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/Button/Button';
import { setOnboardingProgress } from '@entities/onboarding';

export function WelcomeStep() {
  const navigate = useNavigate();

  const handleStart = () => {
    setOnboardingProgress('method');
    void navigate('/onboarding/method');
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 py-6">
      <header className="flex flex-col gap-1">
        <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
          STEP 1 / 4 · 시작
        </span>
        <h1 className="font-ui text-title text-text">당신의 아바타를 만듭니다</h1>
        <p className="text-body-sm text-text-3">
          아바타 생성 방법을 하나 선택하고, 확인 후 시작합니다
        </p>
      </header>

      <ol className="flex flex-col gap-3">
        <li className="border-border bg-bg-elev-1 flex items-start gap-3 rounded-md border p-4">
          <span
            aria-hidden="true"
            className="bg-bg-elev-2 border-border-hi text-text-2 text-mono-meta flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono"
          >
            01
          </span>
          <div className="flex flex-1 flex-col gap-3">
            <p className="font-ui text-subheading text-text">아바타 생성 방법 선택</p>
            <div className="flex items-stretch gap-2">
              <div className="bg-brand-soft border-brand-border text-brand flex flex-1 flex-col items-center gap-0.5 rounded-sm border px-2 py-2 text-center">
                <span className="text-mono-meta font-mono">성향 설문</span>
                <span className="text-mono-micro text-text-3 font-mono">약 2분</span>
              </div>
              <div className="text-text-3 text-mono-meta flex items-center font-mono">또는</div>
              <div className="bg-bg-elev-2 border-border text-text-2 flex flex-1 flex-col items-center gap-0.5 rounded-sm border px-2 py-2 text-center">
                <span className="text-mono-meta font-mono">ChatGPT Bot</span>
                <span className="text-mono-micro text-text-3 font-mono">약 10분</span>
              </div>
            </div>
          </div>
        </li>
        <li className="border-border bg-bg-elev-1 flex items-start gap-3 rounded-md border p-4">
          <span
            aria-hidden="true"
            className="bg-bg-elev-2 border-border-hi text-text-2 text-mono-meta flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono"
          >
            02
          </span>
          <div>
            <p className="font-ui text-subheading text-text">아바타 확인</p>
            <p className="text-body-sm text-text-3">생성된 아바타를 확인합니다 · 이후 튜닝 가능</p>
          </div>
        </li>
      </ol>

      <div className="flex justify-end">
        <Button type="button" onClick={handleStart}>
          시작하기 →
        </Button>
      </div>
    </div>
  );
}
