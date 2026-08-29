import { useRef, useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@shared/lib/cn';

// 이모지는 장식 chrome 이 아닌 사용자 콘텐츠(데이터)라 "장식 이모지 금지" 규칙에 해당하지 않는다.
const SUGGESTED_EXPRESSIONS = [
  '그치 그치',
  '진짜요?',
  'ㅎㅎㅎ',
  '오 신기하네',
  '아 그래서요',
  '음...',
  '맞아맞아',
] as const;

const SUGGESTED_EMOJIS = ['😄', '🥲', '✨', '👀', '😭', '🔥', '🌿', '🌙', '💡', '☕️'] as const;

// 표시 전용 상한 — 입력 개수를 막는 검증은 두지 않는다.
const EXPRESSIONS_HINT_MAX = 10;

const CHIP_BASE =
  'text-caption border-hairline bg-surface text-ink-secondary inline-flex h-[30px] items-center gap-1.5 rounded-pill border';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function ExpressionsField({ value, onChange }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '' || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
  };

  const remove = (chip: string) => {
    onChange(value.filter((c) => c !== chip));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="expressions-input"
            className="text-caption text-ink-secondary font-medium"
          >
            자주 쓰는 표현
          </label>
          <span className="text-micro text-ink-mute tnum">
            {value.length} / {EXPRESSIONS_HINT_MAX}
          </span>
        </div>
        <input
          id="expressions-input"
          ref={inputRef}
          type="text"
          value={input}
          aria-label="자주 쓰는 표현 입력"
          placeholder="입력하고 Enter"
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
          onClick={() => {
            inputRef.current?.focus();
          }}
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
        <span className="text-micro-cap text-ink-mute uppercase">자주 쓰이는 표현</span>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_EXPRESSIONS.map((expr) => {
            const selected = value.includes(expr);
            return (
              <button
                key={expr}
                type="button"
                aria-label={`${expr} 추가`}
                disabled={selected}
                onClick={() => {
                  add(expr);
                }}
                className={cn(
                  CHIP_BASE,
                  'px-3',
                  selected
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:border-primary hover:text-ink cursor-pointer'
                )}
              >
                {expr}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-micro-cap text-ink-mute uppercase">자주 쓰는 이모지</span>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_EMOJIS.map((emoji) => {
            const selected = value.includes(emoji);
            return (
              <button
                key={emoji}
                type="button"
                aria-label={`${emoji} 추가`}
                disabled={selected}
                onClick={() => {
                  add(emoji);
                }}
                className={cn(
                  CHIP_BASE,
                  'px-3 leading-none',
                  selected ? 'cursor-not-allowed opacity-40' : 'hover:border-primary cursor-pointer'
                )}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-micro text-ink-mute leading-[1.5]">
        건너뛰어도 괜찮아요. 나중에 내 아바타 화면에서 추가할 수 있어요.
      </p>
    </div>
  );
}
