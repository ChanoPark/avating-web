import { ArrowRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { MATCH_REQUEST_COST_GEMS } from '@entities/match-request';
import { CreditAmount } from '@features/match-request';

type Props = {
  onRequest: () => void;
  requestOpen: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

// wf-s2-core `ScreenAvatarDetail` 우 상단 featured 카드 — 강조는 틴트 채움이 아니라
// 흰 서피스 + 파란 테두리다. 이 화면의 채워진 파란 CTA 는 여기 하나뿐이다.
//
// 정본의 `예상 호감도` 대형 숫자·진행 바·설명문은 `avatarDetailSchema` 에 대응 필드가 없어
// 렌더하지 않는다 (spec-gap: 상대 아바타 상세 응답에 매칭 점수 없음).
export function AvatarMatchPanel({
  onRequest,
  requestOpen,
  disabled = false,
  disabledReason,
}: Props) {
  return (
    <section
      aria-label="매칭 요청"
      className="border-primary bg-surface shadow-card flex flex-col gap-2.5 rounded-lg border p-4"
    >
      <Button
        type="button"
        variant="primary"
        block
        disabled={disabled}
        title={disabledReason}
        onClick={onRequest}
        aria-haspopup="dialog"
        aria-expanded={requestOpen}
      >
        매칭 요청 보내기
        <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
      </Button>
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-micro text-ink-mute">요청 비용</span>
        {/* 정본 Credit size 12 — micro(11)/caption(13) 사이의 지정 값이다. */}
        <CreditAmount amount={MATCH_REQUEST_COST_GEMS} className="text-ink-secondary text-[12px]" />
      </div>
    </section>
  );
}
