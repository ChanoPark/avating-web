import { cn } from '@shared/lib/cn';

type SurveyOption = {
  answerId: string;
  text: string;
};

type SurveyQuestionProps = {
  question: string;
  options: SurveyOption[];
  value: string | undefined;
  onChange: (answerId: string) => void;
  name: string;
};

// 질문 문장은 카드 헤드(h1)가 이미 보여주므로 legend 는 sr-only 로 접근성 이름만 유지한다.
// 행은 정본 `.onb-opt`(최소 52px · 좌우 16px · surface 면) 이고, 고른 행은 사용자 지시(2026-09-19)로
// 정본의 잉크 링 대신 포인트 색으로 채운다 — 글자가 얹히는 면이라 --action-bg 다.
export function SurveyQuestion({ question, options, value, onChange, name }: SurveyQuestionProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{question}</legend>
      {options.map((opt) => {
        const selected = value === opt.answerId;
        return (
          <label
            key={opt.answerId}
            className={cn(
              'rounded-card text-body flex min-h-13 cursor-pointer items-center gap-3 px-4 py-3',
              // focus-within 이 아니라 has-[:focus-visible] 이어야 마우스 클릭에 링이 안 뜬다.
              'ease-standard transition-colors duration-[var(--dur-fast)] has-[:focus-visible]:shadow-[var(--focus-ring)]',
              selected ? 'bg-action text-on-action' : 'bg-surface text-primary hover:bg-raised'
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.answerId}
              checked={selected}
              onChange={() => {
                onChange(opt.answerId);
              }}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px]',
                selected ? 'border-on-action' : 'border-field'
              )}
            >
              {selected && <span className="bg-on-action block size-2 rounded-full" />}
            </span>
            <span>{opt.text}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
