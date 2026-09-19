import { useId } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';

type Props = {
  onRequest: () => void;
  requestOpen: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

// 강조는 파란 테두리가 아니라 안에 놓인 Brand 버튼이 만든다 — 이 화면의 파란 채움은 여기 하나뿐이다.
// 정본의 `예상 호감도` 숫자·진행 바는 spec-gap(상대 아바타 상세 응답에 매칭 점수 없음)으로 렌더하지 않는다.
export function AvatarMatchPanel({
  onRequest,
  requestOpen,
  disabled = false,
  disabledReason,
}: Props) {
  // 비활성 버튼은 pointer-events 가 없어서 title 툴팁이 마우스로도 닿지 않는다 —
  // 못 누르는 이유는 보이는 문장으로 적고, 버튼과 aria-describedby 로 잇는다.
  const reasonId = useId();
  const showReason = disabled && disabledReason !== undefined;

  return (
    <section
      aria-label="매칭 요청"
      className="bg-canvas rounded-card flex flex-col gap-2.5 p-4 shadow-[inset_0_0_0_1px_var(--border-subtle)]"
    >
      <Button
        type="button"
        // 정본 `.hf-modal>:first-child .cx-btn--brand{background:var(--ink)}` — 다이얼로그가
        // 열리면 화면의 파란 채움은 다이얼로그 쪽 하나뿐이다. 뒤에 파란 버튼을 남겨 두면
        // 검정 CTA 와 파란 버튼이 동시에 보여 시선이 뒤로 끌린다.
        variant={requestOpen ? 'primary' : 'brand'}
        block
        disabled={disabled}
        aria-describedby={showReason ? reasonId : undefined}
        onClick={onRequest}
        aria-haspopup="dialog"
        aria-expanded={requestOpen}
      >
        매칭 요청 보내기
        <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
      </Button>
      {showReason && (
        <p id={reasonId} className="text-caption text-secondary text-center">
          {disabledReason}
        </p>
      )}
    </section>
  );
}
