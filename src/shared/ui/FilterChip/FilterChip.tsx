import { cn } from '@shared/lib/cn';

type FilterChipProps = {
  label: string;
  active: boolean;
  onToggle: (label: string) => void;
};

// components.css `.av-chip` — 선택 상태는 틴트 채움이 아니라 흰 서피스 + 파란 테두리 + inset 링이다.
export function FilterChip({ label, active, onToggle }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        onToggle(label);
      }}
      className={cn(
        'bg-surface text-caption rounded-pill inline-flex h-7.5 items-center gap-1.5 border px-3 font-medium',
        'ease-brand transition-colors duration-[var(--dur-fast)]',
        'focus-visible:shadow-focus focus-visible:outline-none',
        active
          ? 'border-primary text-primary-press shadow-[inset_0_0_0_1px_var(--primary)]'
          : 'border-hairline text-ink-secondary hover:border-primary hover:text-ink'
      )}
    >
      {label}
    </button>
  );
}
