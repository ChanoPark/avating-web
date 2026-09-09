import { useId } from 'react';
import { Tag } from '@shared/ui/Tag';
import { cn } from '@shared/lib/cn';
import type { MyAvatar } from '@entities/match-request';

type Props = {
  avatars: readonly MyAvatar[];
  value: string;
  onChange: (next: string) => void;
  'aria-invalid'?: boolean | undefined;
  'aria-describedby'?: string | undefined;
};

// 선택 상태는 틴트 채움이 아니라 흰 서피스 + 파란 테두리 + 1px inset 링이다.
export function MyAvatarRadioGroup({
  avatars,
  value,
  onChange,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: Props) {
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-label="요청에 사용할 내 아바타"
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
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
              'bg-canvas rounded-card flex cursor-pointer items-center gap-2.75 border p-3',
              'ease-standard transition-colors duration-[var(--dur-fast)]',
              'focus-within:shadow-focus',
              checked ? 'bg-selected border-transparent' : 'border-subtle hover:border-strong',
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
                'relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                checked ? 'border-mark bg-mark' : 'border-field bg-transparent'
              )}
            >
              {checked && <span className="bg-canvas h-1.5 w-1.5 rounded-full" />}
            </span>
            <span
              aria-hidden="true"
              className="bg-id-none text-id-none-fg text-meta rounded-chip flex h-7 w-7 shrink-0 items-center justify-center font-semibold uppercase"
            >
              {avatar.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="text-caption text-primary truncate font-medium">
                  {avatar.name}
                </span>
                {/* meta 는 Badge 가 아니라 중립 Tag 다. */}
                {avatar.isPrimary && <Tag>대표</Tag>}
                {avatar.busy && <Tag>매칭 중</Tag>}
              </span>
              <span className="text-meta text-secondary mt-0.5 block truncate">{avatar.type}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
