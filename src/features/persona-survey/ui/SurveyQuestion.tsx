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
              'bg-surface shadow-card flex cursor-pointer items-center gap-3 rounded-lg border p-3',
              'ease-brand transition-colors duration-[var(--dur-fast)] focus-within:shadow-[var(--focus-ring)]',
              selected ? 'border-primary' : 'border-hairline hover:border-hairline-input'
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
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                selected ? 'border-primary' : 'border-hairline-input'
              )}
            >
              {selected && <span className="bg-primary block h-2 w-2 rounded-full" />}
            </span>
            <span className={cn('text-caption', selected ? 'text-ink' : 'text-ink-secondary')}>
              {opt.text}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
