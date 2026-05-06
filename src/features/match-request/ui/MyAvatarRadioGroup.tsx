import { useId } from 'react';
import { Tag } from '@shared/ui/Tag';
import { cn } from '@shared/lib/cn';
import type { MyAvatar } from '@entities/match-request';

type Props = {
  avatars: readonly MyAvatar[];
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
  describedById?: string | undefined;
};

export function MyAvatarRadioGroup({ avatars, value, onChange, invalid, describedById }: Props) {
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-label="요청에 사용할 내 아바타"
      aria-invalid={invalid ? true : undefined}
      aria-describedby={describedById}
      className="flex flex-col gap-2"
    >
      {avatars.map((avatar) => {
        const checked = value === avatar.id;
        const disabled = avatar.busy;
        const inputId = `${groupId}-${avatar.id}`;

        return (
          <label
            key={avatar.id}
            htmlFor={inputId}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2 transition-colors',
              checked
                ? 'border-brand-border bg-brand-soft'
                : 'border-border bg-bg-elev-2 hover:border-border-hi',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              id={inputId}
              type="radio"
              name="requesterAvatarId"
              value={avatar.id}
              checked={checked}
              disabled={disabled}
              onChange={() => {
                if (!disabled) onChange(avatar.id);
              }}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                'relative flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full border',
                checked ? 'border-brand bg-brand' : 'border-border bg-transparent'
              )}
            >
              {checked && <span className="bg-bg h-1.5 w-1.5 rounded-full" />}
            </span>
            <span
              aria-hidden="true"
              className="bg-bg-elev-3 border-border-hi text-text-2 font-ui text-body-sm flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border font-medium"
            >
              {avatar.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="font-ui text-ui text-text truncate">{avatar.name}</span>
                {avatar.isPrimary && (
                  <Tag variant="brand" className="text-mono-micro">
                    대표
                  </Tag>
                )}
                {avatar.busy && (
                  <Tag variant="warning" className="text-mono-micro">
                    매칭 중
                  </Tag>
                )}
              </span>
              <span className="text-mono-meta text-text-3 mt-0.5 block font-mono">
                {avatar.type}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
