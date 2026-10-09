import { AvatarIdentityTile } from '@entities/avatar';
import { cn } from '@shared/lib/cn';

type PairAvatar = { name: string; color?: string | undefined };

const FACE_CLASS = 'text-meta absolute size-6.5 rounded-full leading-none';

type AvatarPairProps = {
  mine: PairAvatar;
  partner: PairAvatar;
  /** 앞 원의 테두리는 놓인 면의 색이어야 두 원이 갈라져 보인다. */
  haloClass?: string;
};

export function AvatarPair({ mine, partner, haloClass = 'ring-canvas' }: AvatarPairProps) {
  return (
    <span className="relative size-10 shrink-0">
      <AvatarIdentityTile
        name={mine.name}
        color={mine.color}
        className={cn(FACE_CLASS, 'top-0 left-0')}
      />
      <AvatarIdentityTile
        name={partner.name}
        color={partner.color}
        className={cn(FACE_CLASS, 'right-0 bottom-0 ring-2', haloClass)}
      />
    </span>
  );
}
