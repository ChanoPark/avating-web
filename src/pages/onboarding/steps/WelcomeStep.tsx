import { useNavigate } from 'react-router';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';
import { Card } from '@shared/ui/Card/Card';
import { cn } from '@shared/lib/cn';
import { setOnboardingMethod, setOnboardingProgress } from '@entities/onboarding';
import { WIZARD_ACTIONS, WIZARD_BODY_FLAT, WIZARD_HEAD } from '@shared/ui/wizard';

// S-02-01 환영 — 레일 없는 플랫 형태. 앞으로 할 일 4단계를 체크리스트로 보여주기만 하고
// 진행 표시는 하지 않는다 (다음 화면부터 레일이 담당한다).
// "아바타 만들기"는 Step 1(이름·설명)로, "ChatGPT Bot 연동"은 같은 흐름에 method=connect 를
// 사전 선택해 진입한다.
// 총 문항 수는 서버 시딩(지표 7종 × questionCount)에 따라 달라진다 — 문구에 숫자를 박지 않는다.
const TASKS = ['기본 정보 입력', '생성 방법 선택', '성향 설문', '아바타 확인'] as const;

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
    <>
      <div className={WIZARD_BODY_FLAT}>
        <div className={WIZARD_HEAD}>
          <h1 className="text-heading-lg text-ink">환영해요, 이제 아바타를 만들 차례예요</h1>
          <p className="text-body-sm text-ink-mute">
            내 성향을 분석해 아바타를 만들고, 첫 번째 매칭을 시작할 수 있어요.
          </p>
        </div>

        <Card className="overflow-hidden">
          <ol className="divide-hairline flex flex-col divide-y">
            {TASKS.map((task, index) => {
              // 전부 미완료 상태 — 첫 항목만 active.
              const isActive = index === 0;
              return (
                <li key={task} className="text-caption flex items-center gap-2.5 px-3.5 py-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'text-micro tnum bg-surface flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border',
                      isActive ? 'border-primary text-primary' : 'border-hairline text-ink-mute'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className={isActive ? 'text-ink font-medium' : 'text-ink-secondary'}>
                    {task}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="flex items-center gap-2">
          <Clock size={14} strokeWidth={1.5} aria-hidden="true" className="text-ink-mute" />
          <span className="text-caption text-ink-mute tnum">약 2분 소요</span>
        </div>
      </div>

      <div className={WIZARD_ACTIONS}>
        {/* 보조 경로는 채워진 CTA 를 쓰지 않는다 (밴드당 파란 CTA 1개). 다만 평문처럼 보여
            버튼인지 알아보기 어려웠으므로, 같은 규칙을 지키는 디자인 시스템 ghost 버튼을 쓴다. */}
        <Button type="button" variant="ghost" onClick={handleBotConnect}>
          ChatGPT Bot 연동
        </Button>
        <Button type="button" onClick={handleStart}>
          아바타 만들기
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    </>
  );
}
