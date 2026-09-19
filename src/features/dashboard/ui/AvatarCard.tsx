import { ArrowRight } from 'lucide-react';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { Tag } from '@shared/ui/Tag';
import type { AvatarSimCandidate } from '@entities/avatar';
import { avatarInitial } from '../lib/avatarInitial';

type AvatarCardProps = {
  avatar: AvatarSimCandidate;
  onOpen: (id: string) => void;
  onMatch: (id: string) => void;
};

// 목록은 행마다 반복되므로 채워진 파란 CTA 를 쓰지 않는다 (밴드당 primary 는 하나).
// 인증·예상 호감도는 후보 조회가 주지 않아 그리지 않는다.
export function AvatarCard({ avatar, onOpen, onMatch }: AvatarCardProps) {
  return (
    <li className="border-subtle bg-canvas rounded-card relative flex flex-col gap-2.5 border p-3.5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="bg-id-none text-id-none-fg text-caption flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] font-semibold uppercase"
        >
          {avatarInitial(avatar.name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* after 오버레이로 카드 전체를 클릭 대상으로 만든다 — 버튼을 중첩하지 않고 이름 버튼 하나로 처리한다. */}
          {/* 이름#태그는 한 덩어리로 쓴다(wf2-spec) — 줄바꿈 없이 함께 잘린다. 스팬 경계에서 이름이 둘로
              읽히지 않게 접근 가능한 이름을 보이는 글자 그대로 준다. */}
          <button
            type="button"
            aria-label={`${avatar.name}#${avatar.hashtag}`}
            onClick={() => {
              onOpen(avatar.avatarId);
            }}
            className="text-caption text-primary rounded-chip after:rounded-card truncate text-left font-medium after:absolute after:inset-0"
          >
            {avatar.name}
            <span className="text-secondary font-normal">#{avatar.hashtag}</span>
          </button>
          {avatar.description !== '' && (
            <span className="text-meta text-secondary truncate">{avatar.description}</span>
          )}
        </span>
      </div>

      {avatar.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.25">
          {avatar.tags.slice(0, 3).map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      )}

      {/* 진행 중 초대에 걸린 후보도 목록에 남는다(canRequestSimulation=false) — 상태는 무채색 마크 + 단어로 알린다.
          소개·태그가 빈 후보도 있어 mt-auto 로 행의 카드끼리 액션 줄 높이를 맞춘다. */}
      <div className="mt-auto flex items-center justify-between gap-2">
        {!avatar.canRequestSimulation && <Badge mark="running">매칭 중</Badge>}
        {/* 오버레이 위로 올리는 relative 를 버튼이 아니라 감싸는 span 에 둔다 — disabled 버튼은
            pointer-events:none 이라, 버튼만 올리면 클릭이 아래 카드 오버레이로 새어 상세로 이동한다. */}
        <span className="relative ml-auto">
          <Button
            variant="secondary"
            size="sm"
            disabled={!avatar.canRequestSimulation}
            onClick={() => {
              onMatch(avatar.avatarId);
            }}
          >
            매칭
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </span>
      </div>
    </li>
  );
}
