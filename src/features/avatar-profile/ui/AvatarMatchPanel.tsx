import { ArrowRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';

type Props = {
  onRequest: () => void;
  requestOpen: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

// 강조는 틴트 채움이 아니라 흰 서피스 + 파란 테두리다 — 이 화면의 채워진 파란 CTA 는 여기 하나뿐이다.
// 정본의 `예상 호감도` 숫자·진행 바는 spec-gap(상대 아바타 상세 응답에 매칭 점수 없음)으로 렌더하지 않는다.
export function AvatarMatchPanel({
  onRequest,
  requestOpen,
  disabled = false,
  disabledReason,
}: Props) {
  return (
    <section
      aria-label="매칭 요청"
      className="bg-canvas rounded-card flex flex-col gap-2.5 p-4 shadow-[inset_0_0_0_1px_var(--border-subtle)]"
    >
      <Button
        type="button"
        variant="brand"
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
    </section>
  );
}
