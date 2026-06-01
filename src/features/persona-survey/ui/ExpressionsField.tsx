import { useState, type KeyboardEvent } from 'react';
import { cn } from '@shared/lib/cn';

// 와이어프레임 S04b — 자주 쓰는 표현(선택). 사용자의 말투·표현·이모지를 수집해 아바타가 더 나답게 말하도록 한다.
// 이모지는 장식 chrome 이 아닌 사용자 콘텐츠(데이터)이므로 디자인 시스템의 "장식 이모지 금지" 규칙에 해당하지 않는다.
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

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function ExpressionsField({ value, onChange }: Props) {
  const [input, setInput] = useState('');

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
      <div className="bg-bg-elev-2 border-border-hi flex min-h-[64px] flex-wrap items-center gap-2 rounded-sm border p-2.5">
        {value.map((chip) => (
          <span
            key={chip}
            className="bg-brand-soft border-brand-border text-brand inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-sm"
          >
            {chip}
            <button
              type="button"
              aria-label={`${chip} 삭제`}
              onClick={() => {
                remove(chip);
              }}
              className="text-text-3 hover:text-text"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          aria-label="자주 쓰는 표현 입력"
          placeholder="입력하고 Enter…"
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className="text-text placeholder:text-text-3 min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
          자주 쓰이는 표현
        </span>
        <div className="flex flex-wrap gap-2">
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
                  'border-border bg-bg-elev-2 text-text-2 rounded-sm border px-2 py-0.5 text-sm',
                  selected ? 'opacity-40' : 'hover:border-border-hi'
                )}
              >
                + {expr}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
          자주 쓰는 이모지
        </span>
        <div className="flex flex-wrap gap-2">
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
                  'border-border bg-bg-elev-2 rounded-sm border px-2 py-0.5 text-base leading-none',
                  selected ? 'opacity-40' : 'hover:border-border-hi'
                )}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-mono-micro text-text-3 font-mono">
        ⓘ 건너뛰어도 괜찮아요. 나중에 내 아바타 화면에서 추가할 수 있어요.
      </p>
    </div>
  );
}
