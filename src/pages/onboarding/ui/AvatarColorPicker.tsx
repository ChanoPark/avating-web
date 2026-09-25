import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@shared/lib/cn';
import { AVATAR_IDENTITY_COLORS, AvatarIdentityTile, identityHex } from '@entities/avatar';
import type { AvatarIdentityName } from '@entities/avatar';

type AvatarColorPickerProps = {
  value: AvatarIdentityName;
  /** 견본 원에 올릴 이름 — 입력 중인 아바타 이름을 그대로 받는다. */
  name: string;
  registration: UseFormRegisterReturn;
};

// 정본 S-02-02 "아바타 색" ColorPicker(.cx-swatches)는 5열 · 40px 원 · 12px 색 이름이지만, 사용자 결정(2026-09-25)으로
// 작은 원 10개를 한 줄에 둔다. 모바일 폼 폭(220px)에도 들어가도록 원은 칸 폭을 따라 줄고(최대 28px), 선택 링은
// 원 사이 4px 안에 들어가게 offset 1px 로 둔다. 색 이름은 라디오 aria-label 로만 둔다. 네이티브 라디오라 방향키 이동·Space 선택이 그대로 된다. 입력은 숨기고 포커스 링은 견본 원이 대신 그린다.
export function AvatarColorPicker({ value, name, registration }: AvatarColorPickerProps) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2.5">
      <span id={labelId} className="text-caption text-secondary font-medium">
        아바타 색
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex flex-nowrap items-center justify-between gap-1"
      >
        {AVATAR_IDENTITY_COLORS.map((color) => {
          const isSelected = color.name === value;
          return (
            <label key={color.name} className="flex min-w-0 flex-1 cursor-pointer justify-center">
              <input
                type="radio"
                value={color.name}
                aria-label={color.label}
                className="peer sr-only"
                {...registration}
              />
              {/* 선택은 파란 링이 아니라 잉크 링이다 — 색을 고르는 건 눌린 상태가 아니다(.cx-swatch--selected). */}
              <AvatarIdentityTile
                name={name}
                color={identityHex(color.name)}
                data-testid="color-swatch-disc"
                className={cn(
                  'text-meta aspect-square w-full max-w-7 rounded-full leading-none',
                  'peer-focus-visible:outline-mark peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3',
                  isSelected && 'ring-ink ring-offset-canvas ring-2 ring-offset-1'
                )}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
