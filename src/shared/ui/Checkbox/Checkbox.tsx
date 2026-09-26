import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@shared/lib/cn';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

// `.cx-check__box` — 네이티브 체크박스는 width/height/border 를 무시하고 자기 크기로 그려서,
// 테두리나 outline 을 얹으면 실제 보이는 네모와 어긋난다. 모양을 끄고 input 자체를 상자로 그린다.
// 오류는 aria-invalid 하나로 판단한다 — 스크린리더가 듣는 상태와 보이는 상태가 갈리지 않게.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...rest },
  ref
) {
  const invalid = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true';

  return (
    <span className={cn('relative inline-grid size-4 shrink-0 place-items-center', className)}>
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'peer bg-canvas rounded-chip size-4 cursor-pointer appearance-none border-[1.5px]',
          'ease-standard transition-colors duration-[var(--dur-fast)]',
          'checked:bg-action checked:border-action',
          'disabled:bg-field-disabled disabled:border-field-border-disabled disabled:cursor-not-allowed',
          invalid ? 'border-danger-mark' : 'border-field enabled:hover:border-mark'
        )}
        {...rest}
      />
      <Check
        size={10}
        strokeWidth={2.5}
        aria-hidden="true"
        className="text-on-action pointer-events-none absolute opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
});
