import { Tag } from '@shared/ui/Tag';
import { Button } from '@shared/ui/Button';
import type { AvatarSessionHistoryItem, AvatarSessionHistoryResult } from '@entities/avatar';

type Props = {
  items: readonly AvatarSessionHistoryItem[];
};

const resultLabel: Record<AvatarSessionHistoryResult, string> = {
  matched: '매칭 성공',
  ended: '종료',
  aborted: '중단',
};

const resultVariant: Record<AvatarSessionHistoryResult, 'success' | 'default' | 'warning'> = {
  matched: 'success',
  ended: 'default',
  aborted: 'warning',
};

export function AvatarSessionHistory({ items }: Props) {
  return (
    <section
      aria-labelledby="avatar-session-history-heading"
      className="border-border bg-bg-elev-1 flex flex-col rounded-md border p-4"
    >
      <h3
        id="avatar-session-history-heading"
        className="text-mono-micro text-text-3 font-mono uppercase"
      >
        세션 이력
      </h3>
      {items.length === 0 ? (
        <p className="text-text-3 text-body-sm mt-3">아직 세션 이력이 없어요.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="border-border bg-bg rounded-sm border p-2">
              <div className="flex items-center justify-between">
                <span className="text-mono-meta text-text-2 font-mono">
                  TURN {item.turn}/{item.totalTurns}
                </span>
                <Tag variant={resultVariant[item.result]}>{resultLabel[item.result]}</Tag>
              </div>
              <p className="text-text-3 text-mono-meta mt-1 font-mono">호감도 {item.affinity}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <Button
          variant="ghost"
          size="sm"
          disabled
          title="관전 화면 준비 중"
          aria-label="관전 (준비 중)"
          className="w-full"
        >
          관전 →
        </Button>
      </div>
    </section>
  );
}
