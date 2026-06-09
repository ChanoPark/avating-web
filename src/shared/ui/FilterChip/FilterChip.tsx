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
          ? 'border-border-focus bg-bg-elev-2 text-text'
          : 'border-border-hi text-text-2 hover:border-border-focus hover:bg-bg-elev-2 hover:text-text bg-transparent'
      )}
    >
      {label}
    </button>
  );
}
