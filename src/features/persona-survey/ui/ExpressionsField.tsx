import { ChipInputField } from './ChipInputField';

// 정본(wf/wf-s1-entry.jsx `ScreenOnbExpressions`)은 한 화면에서 관심사 태그와 표현을 같이 받는다 —
// 컴포넌트 이름은 정본의 화면 이름(`ScreenOnbExpressions`)을 따른다.
const SUGGESTED_TAGS = ['독립서점', '전시', '러닝', '필름 사진', '베이킹', '천문'] as const;

const SUGGESTED_EXPRESSIONS = ['진짜요?', '오 신기하네', '아 그래서요', '음…'] as const;

const CHIP_MAX = 10;

type Props = {
  interestTags: string[];
  onInterestTagsChange: (next: string[]) => void;
  expressions: string[];
  onExpressionsChange: (next: string[]) => void;
};

export function ExpressionsField({
  interestTags,
  onInterestTagsChange,
  expressions,
  onExpressionsChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <ChipInputField
        label="관심사 태그"
        placeholder="입력하고 엔터를 눌러주세요."
        value={interestTags}
        onChange={onInterestTagsChange}
        max={CHIP_MAX}
        suggestions={SUGGESTED_TAGS}
        suggestionsLabel="추천 태그"
      />

      <hr className="border-subtle border-t" />

      <ChipInputField
        label="자주 쓰는 표현"
        placeholder="입력하고 엔터를 눌러주세요."
        value={expressions}
        onChange={onExpressionsChange}
        max={CHIP_MAX}
        suggestions={SUGGESTED_EXPRESSIONS}
        suggestionsLabel="자주 쓰이는 표현"
      />

      {/* "이모지 입력은 받지 않습니다" 문구는 2026-08-30 사용자 결정으로 제거 — 입력 차단은 유지 */}
      <p className="text-meta text-secondary leading-[1.5]">관심사 태그와 표현 모두 최대 10개</p>
    </div>
  );
}
