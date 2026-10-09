type AvatarNameLineProps = {
  avatar: { name: string; hashtag?: string | undefined };
};

/** 이름 바로 뒤에 해시태그를 붙인다. 자리가 모자라면 이름만 말줄임하고 해시태그는 그대로 둔다. */
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
