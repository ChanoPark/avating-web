import { cn } from '@shared/lib/cn';

type FilterChipProps = {
  label: string;
  active: boolean;
  onToggle: () => void;
};

// `.cx-tag--button` — 선택은 **잉크 채움**이다. 파란 테두리도, 파란 틴트도 얹지 않는다.
export function FilterChip({ label, active, onToggle }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        'text-caption inline-flex h-7 flex-none cursor-pointer items-center gap-2 rounded-full px-3 font-medium whitespace-nowrap',
        'ease-standard transition-colors duration-[var(--dur-fast)]',
        active ? 'bg-ink text-on-ink hover:bg-ink-hover' : 'bg-surface text-primary hover:bg-raised'
      )}
    >
      {label}
    </button>
  );
}
