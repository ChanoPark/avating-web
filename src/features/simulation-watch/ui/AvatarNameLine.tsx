type AvatarNameLineProps = {
  avatar: { name: string; hashtag?: string | undefined };
};

export function AvatarNameLine({ avatar }: AvatarNameLineProps) {
  return (
    <span className="flex min-w-0 items-baseline gap-1.25">
      <span className="truncate">{avatar.name}</span>
      {avatar.hashtag !== undefined && (
        <span className="text-meta text-secondary tnum shrink-0 font-normal tracking-[0.02em]">
          #{avatar.hashtag}
        </span>
      )}
    </span>
  );
}
