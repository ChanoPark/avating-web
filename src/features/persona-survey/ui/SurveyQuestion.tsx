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

export function SurveyQuestion({ question, options, value, onChange, name }: SurveyQuestionProps) {
  return (
    <fieldset className="border-border rounded-md border p-4">
      <legend className="text-body text-text px-1">{question}</legend>
      <div className="mt-3 flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt.answerId}
            className={[
              'flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 transition-colors',
              value === opt.answerId
                ? 'border-brand bg-brand-soft'
                : 'border-border hover:border-border-hi',
            ].join(' ')}
          >
            <input
              type="radio"
              name={name}
              value={opt.answerId}
              checked={value === opt.answerId}
              onChange={() => {
                onChange(opt.answerId);
              }}
              className="sr-only"
            />
            <span className="text-body-sm text-text">{opt.text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
