import { cn } from '@shared/lib/cn';

type FilterChipProps = {
  label: string;
  active: boolean;
  onToggle: (label: string) => void;
};

export function FilterChip({ label, active, onToggle }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        onToggle(label);
      }}
      className={cn(
        'font-ui text-body-sm inline-flex h-7 items-center rounded-sm border px-3 transition-colors',
        'duration-[var(--duration-fast)] ease-[var(--ease)]',
        active
          ? 'border-brand-border bg-brand-soft text-brand'
          : 'border-border bg-bg-elev-2 text-text-2 hover:text-text'
      )}
    >
      {label}
    </button>
  );
}
