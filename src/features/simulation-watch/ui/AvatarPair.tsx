import { AvatarIdentityTile } from '@entities/avatar';
import { cn } from '@shared/lib/cn';

type PairAvatar = { name: string; color?: string | undefined };

const FACE_CLASS = 'text-meta absolute size-6.5 rounded-full leading-none';

type AvatarPairProps = {
  mine: PairAvatar;
  partner: PairAvatar;
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
