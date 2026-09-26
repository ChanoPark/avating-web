import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@shared/lib/cn';

type AvatarTagBadgeProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  hashtag: string;
};

// 정본 badge 형(.cx-atag) — 20px pill, 연한 회색 면(--bg-surface) · 보조 글자색. 아바타 색은 이니셜 타일만 쓰고
// 뱃지는 색을 칠하지 않는다(사용자 결정 2026-09-25). 이름 옆·아래 배치는 쓰는 자리가 정한다.
// 정본 AvatarTag 는 복사 버튼인데, 카드에선 이름이 이미 버튼이라 중첩을 피해 span 으로 둔다.
export function AvatarTagBadge({ hashtag, className, ...rest }: AvatarTagBadgeProps) {
  return (
    <span
      className={cn(
        'text-meta bg-surface text-secondary inline-flex h-5 w-fit shrink-0 items-center rounded-full px-2 leading-5 font-medium tracking-[.02em]',
        className
      )}
      {...rest}
    >
      #{hashtag}
    </span>
  );
}
