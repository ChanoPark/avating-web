import { cn } from '@shared/lib/cn';

type SurveyOption = {
  value: string;
  label: string;
};

type SurveyQuestionProps = {
  question: string;
  options: SurveyOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  name: string;
  error?: string;
};

export function SurveyQuestion({
  question,
  options,
  value,
  onChange,
  name,
  error,
}: SurveyQuestionProps) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <fieldset
      className={cn('rounded-md border p-4', error ? 'border-danger' : 'border-border')}
      aria-describedby={errorId}
    >
      <legend className="text-body text-text px-1">{question}</legend>
      <div className="mt-3 flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 transition-colors',
              value === opt.value
                ? 'border-brand bg-brand-soft'
                : 'border-border hover:border-border-hi'
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => {
                onChange(opt.value);
              }}
              className="sr-only"
            />
            <span className="text-body-sm text-text">{opt.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-body-sm text-danger mt-2">
          {error}
        </p>
      )}
    </fieldset>
  );
}
