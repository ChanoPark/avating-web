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

// 선택 상태는 --bg-selected 틴트 하나뿐이다 — 파란 테두리도 inset 링도 얹지 않는다
// (Codex 절대 규칙 ③).
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
              // focus-within 은 프로그램적 포커스(모달이 열리며 첫 라디오로 옮겨가는 것)에도
              // 걸려, 마우스로 열기만 해도 첫 행에 파란 링이 떴다. 키보드 포커스에만 건다.
              'has-[:focus-visible]:shadow-focus',
              checked ? 'bg-selected border-transparent' : 'border-subtle hover:border-strong',
              // 정본은 disabled 에 opacity 를 쓰지 않는다 — 뒤와 섞이면 대비비를 말할 수 없다.
              // 색은 부모에 걸지 않는다: 자식이 전부 자기 색을 들고 있어 상속이 끊긴다
              // (`cn` 은 단순 join 이라 뒤에 적어도 이기지 않는다). 잎마다 직접 내린다.
              disabled && 'cursor-not-allowed'
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
                // `.cx-check--disabled .cx-check__box` — 판과 테두리가 같이 내려간다.
                disabled
                  ? 'bg-field-disabled border-[var(--field-border-disabled)]'
                  : checked
                    ? 'border-mark bg-mark'
                    : 'border-field bg-transparent'
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
              {/* 줄상자를 20px 로 고정한다 — 28px `.cx-tag` 를 그대로 쓰면 배지가 붙은 행만
                  9px 높아져 목록의 행 높이가 74 / 64.84 로 갈린다. */}
              <span className="flex h-5 items-center gap-1.5">
                <span
                  className={cn(
                    'text-caption truncate font-medium',
                    disabled ? 'text-disabled' : 'text-primary'
                  )}
                >
                  {avatar.name}
                </span>
                {/* meta 는 Badge 가 아니라 중립 Tag 다. */}
                {avatar.isPrimary && (
                  <Tag size="sm" disabled={disabled}>
                    대표
                  </Tag>
                )}
                {avatar.busy && (
                  <Tag size="sm" disabled={disabled}>
                    매칭 중
                  </Tag>
                )}
              </span>
              <span
                className={cn(
                  'text-meta mt-0.5 block truncate',
                  disabled ? 'text-disabled' : 'text-secondary'
                )}
              >
                {avatar.type}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
