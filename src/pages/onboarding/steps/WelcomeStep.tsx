import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/Button/Button';

const STEPS = [
  { num: '01', title: '페르소나 설문', desc: '나를 가장 잘 표현하는 답을 선택해주세요.' },
  {
    num: '02',
    title: 'AI 아바타 연결',
    desc: 'Custom GPT에 연결 코드를 입력해 아바타를 활성화합니다.',
  },
  { num: '03', title: '아바타 확인', desc: '생성된 아바타의 성향과 스탯을 확인하세요.' },
];

export function WelcomeStep() {
  const navigate = useNavigate();

  const handleStart = () => {
    void navigate('/onboarding/survey');
  };

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-8 px-4 py-8">
      <div className="text-center select-none">
        <h1 className="text-title text-text mb-3">당신의 아바타를 만듭니다</h1>
        <p className="text-body text-text-2">
          AI 아바타가 당신 대신 소개팅을 합니다. 3단계로 시작하세요.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {STEPS.map((step) => (
          <li
            key={step.num}
            className="border-border bg-bg-elev-2 flex cursor-default items-start gap-4 rounded-md border p-4 select-none"
          >
            <span className="text-brand font-mono text-lg font-bold">{step.num}</span>
            <div>
              <p className="text-subheading text-text font-semibold">{step.title}</p>
              <p className="text-body-sm text-text-2 mt-0.5">{step.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <Button type="button" onClick={handleStart} className="w-full">
        시작하기
      </Button>
    </div>
  );
}
