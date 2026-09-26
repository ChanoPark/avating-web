import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@shared/lib/cn';
import { avatarInitial } from '../lib/avatarInitial';
import { AVATAR_IDENTITY_CLASS, identityFromHex } from '../lib/identity';

type AvatarIdentityTileProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  name: string;
  /** 서버 Avatar.color hex. 없거나 풀 밖이면 --id-none 회색이다. */
  color?: string | undefined;
};

// 아바타 이미지가 없어 identity 색 + 이니셜로 자리를 채운다(wf2-spec). 크기·모양·글자 크기는 쓰는 자리가 className 으로 준다.
// identity 색은 이름 없이 혼자 나오지 않는다 — 이름은 옆 글자가 알리므로 타일은 장식이다.
export function AvatarIdentityTile({ name, color, className, ...rest }: AvatarIdentityTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center font-semibold uppercase',
        AVATAR_IDENTITY_CLASS[identityFromHex(color)],
        className
      )}
      {...rest}
    >
      {avatarInitial(name)}
    </span>
  );
}
