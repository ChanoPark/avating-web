import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@shared/lib/cn';

// 정본 note("이모지 입력은 받지 않습니다")를 문구로만 두면 거짓말이 되므로 입력 단계에서 막는다.
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

const CHIP_BASE =
  'text-caption border-hairline bg-surface text-ink-secondary inline-flex h-[30px] items-center gap-1.5 rounded-pill border';

type Props = {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
  suggestions: readonly string[];
  suggestionsLabel: string;
};

export function ChipInputField({
  label,
  placeholder,
  value,
  onChange,
  max,
  suggestions,
  suggestionsLabel,
}: Props) {
  const inputId = useId();
  const labelId = useId();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '' || value.includes(trimmed)) return;
    if (EMOJI_PATTERN.test(trimmed)) return;
    if (value.length >= max) return;
    onChange([...value, trimmed]);
  };

  const remove = (chip: string) => {
    onChange(value.filter((c) => c !== chip));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    // 한글 IME 조합을 끝내는 Enter(keydown isComposing=true)를 처리하면 조합 중 글자가
    // 잘린 값이 추가되고 입력만 지워진다 — 조합 확정 후의 Enter 만 받는다.
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    add(input);
    setInput('');
  };

  const handleAddClick = () => {
    if (input.trim() !== '') {
      add(input);
      setInput('');
    }
    inputRef.current?.focus();
  };

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label
            id={labelId}
            htmlFor={inputId}
            className="text-caption text-ink-secondary font-medium"
          >
            {label}
          </label>
          <span className="text-micro text-ink-mute tnum">
            {value.length} / {max}
          </span>
        </div>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={input}
          aria-label={`${label} 입력`}
          placeholder={placeholder}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className="bg-canvas text-caption text-ink placeholder:text-ink-mute border-hairline-input focus:border-primary focus-visible:shadow-focus ease-brand w-full rounded-sm border px-3 py-2.25 transition-colors duration-[var(--dur-fast)] outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {value.map((chip) => (
          <span key={chip} className={cn(CHIP_BASE, 'pr-1.5 pl-3')}>
            {chip}
            <button
              type="button"
              aria-label={`${chip} 삭제`}
              onClick={() => {
                remove(chip);
              }}
              className="text-ink-mute hover:bg-hairline hover:text-ink flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-full"
            >
              {/* 문자 글리프(✕) 대신 라인 아이콘 — Pretendard 에 없는 글자는 시스템 폰트로 폴백한다. */}
              <X size={11} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </span>
        ))}
        <button
          type="button"
          aria-label={`${label} 추가`}
          onClick={handleAddClick}
          className={cn(
            CHIP_BASE,
            'text-ink-mute hover:border-primary hover:text-ink cursor-pointer px-3'
          )}
        >
          <Plus size={12} strokeWidth={1.5} aria-hidden="true" />
          추가
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-micro text-ink-mute">{suggestionsLabel}</span>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => {
            const selected = value.includes(suggestion);
            return (
              <button
                key={suggestion}
                type="button"
                aria-label={`${suggestion} 추가`}
                disabled={selected}
                onClick={() => {
                  add(suggestion);
                }}
                className={cn(
                  CHIP_BASE,
                  'px-3',
                  selected
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:border-primary hover:text-ink cursor-pointer'
                )}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
