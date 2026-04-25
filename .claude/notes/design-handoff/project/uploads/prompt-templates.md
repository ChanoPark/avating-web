# Claude Design 프롬프트 템플릿

디자인 시스템 설정 이후, Claude Design에서 자주 쓰는 작업별 프롬프트 템플릿.

> **전제**: Organization의 디자인 시스템이 "Published" 상태이며, 모든 프로젝트가 자동으로 아바팅 스타일을 상속한다. 따라서 이 템플릿들은 **톤·색상·폰트를 재지시하지 않는다** — 그건 디자인 시스템이 처리한다.

---

## 1. 신규 화면 탐색 (Exploration)

### 패턴 A — 단일 화면 프로토타입

```
Create a {screen-name} screen.

Pattern: {A/B/C/D/E/F/G} from our design system
Purpose: {one sentence}

Primary content:
- {item 1}
- {item 2}
- {item 3}

Primary action: {button label}
Key data to display: {fields}

Viewport: desktop 1280×900
Include: empty state, loading state, error state variations as separate frames
```

**예시 — 다이아 구매 화면**

```
Create a gem purchase screen.

Pattern: B (App Shell) with inline pricing panel
Purpose: 사용자가 다이아 패키지를 선택하고 결제를 진행

Primary content:
- 현재 다이아 잔액 (상단)
- 4개의 패키지 카드 (100/500/1500/5000 gems)
- 각 패키지: 다이아 수량, 원화 가격, 보너스 표시
- 최근 구매 내역 (하단 테이블)

Primary action: "구매하기" (각 카드 내부)
Key data: 잔액, 패키지 가격, 보너스 비율, 거래 ID

Viewport: desktop 1280×900
Include: 로딩 상태(결제 진행 중), 성공/실패 모달 variations
```

### 패턴 B — 플로우 전체 (Wizard)

```
Create a {flow-name} flow with {N} steps.

Pattern: C (Wizard)
Step 1: {brief}
Step 2: {brief}
Step N: {brief}

Each step should follow the wizard shell:
- Progress bar (shimmer on active)
- Step label · Title · Subtitle
- Content area
- Footer with Back / hint / Next

Include all {N} steps as separate frames so I can see the full flow.
```

---

## 2. 기존 화면 변형 (Variation)

### 같은 화면의 다른 상태

```
Create 4 variations of {screen-name} showing these states:
1. Default (with sample data)
2. Loading (skeleton or spinner)
3. Empty (no data)
4. Error (API failure with retry)

All frames at desktop 1280×900. Maintain the same base layout.
```

### 반응형 변형

```
Show {screen-name} at three breakpoints:
1. Mobile 390×844
2. Tablet 768×1024
3. Desktop 1280×900

Demonstrate how the {sidebar/side-panel/stats-strip} adapts.
For mobile, the sidebar should collapse into a bottom navigation.
```

---

## 3. 컴포넌트 단위 작업

### 새 컴포넌트 제안

```
Design a {component-name} component for our UI library.

Purpose: {when is this used}
Variants needed: {list variants}
States needed: default, hover, focus, disabled, loading (if applicable)

Show all variants × states in a grid layout for review.
Include a short usage example at the bottom.

Note: This component may be added to our catalog only after DSD approval.
Provide clear justification of why existing components (Button, Input, Tag,
AvatarMark, StatBar, Kbd) cannot cover this use case.
```

### 기존 컴포넌트 변형 탐색

```
Explore 3 variations of the existing {component} component for the context
of {specific scenario}. Do not change the core visual language — we want
to see which existing variant works best, or whether a new variant is justified.

Show all 3 side-by-side with the current use case as reference.
```

---

## 4. DSD 기반 프로토타입 (가장 권장)

가장 통제된 결과를 얻으려면, 먼저 DSD를 작성한 후 그 내용을 그대로 프롬프트로 사용한다.

```
Create a prototype based on this design specification:

[DSD 문서 전체를 여기에 붙여넣기]

Render:
- The full-screen desktop version (1280×900)
- The mobile version (390×844)
- Key interaction states listed in section "9. 인터랙션"

Follow the copywriting from section "12. 카피라이팅" verbatim.
```

---

## 5. 피드백·수정 프롬프트 (2차 이후)

### 구조적 변경 (chat 메시지로)

```
This is close but let's restructure:
- Move the {element} from {current location} to {new location}
- The {section} should follow our Pattern {X} more strictly
- Remove the {decorative element} — our design system prohibits it
```

### 세부 조정 (inline comment 권장)

Claude Design에서는 인라인 코멘트가 더 효과적:
- 특정 요소를 클릭
- "This button should be `variant=ghost` not primary"
- "Reduce this padding from {current} to `space-3` (12px)"

### 제약 위반 교정 — 자주 쓰는 문구

Claude Design이 제약을 어겼을 때 빠르게 교정하는 문구들:

| 상황 | 교정 문구 |
|------|-----------|
| 보라 그라데이션 발견 | "Remove gradient — our system only uses solid `--brand #5170FF` for accents." |
| 이모지 사용 발견 | "Replace all emojis with Lucide icons. See 'ICONS' section in our system notes." |
| 과도한 radius | "Reduce all border-radius to max 12px (`rounded-xl`). No `rounded-2xl` or larger." |
| 감정 과잉 카피 | "Rewrite copy in fact-based tone. Replace '{emotional phrase}' with concrete data or neutral description." |
| Italic 발견 | "Remove all italic text. Our typography system prohibits italic." |
| 카드 그리드(잘못된 맥락) | "This is a comparison context — use Pattern G (Data List / table) instead of card grid." |
| 글래스모피즘 | "Remove backdrop-filter blur. Our system uses solid surfaces at elevation levels." |
| 애니메이션 과다 | "Remove float/pulse/glow animations. Only typing, shimmer, and functional pulse-dot are allowed." |

---

## 6. Claude Code 핸드오프 프롬프트

Claude Design의 "Handoff to Claude Code" 버튼 대신, DSD 워크플로우를 쓸 경우:

```
[Claude Code 세션에서]

/dev Implement the screen from this Claude Design prototype.

Source:
- Claude Design URL: {paste-URL}
- Corresponding DSD: design/dsd/{screen-name}.md

Rules:
1. Use only components from @/shared/components/ui
2. Follow the DSD as the authoritative spec (Claude Design output is reference)
3. If the Claude Design output contradicts the DSD, follow the DSD
4. If the DSD doesn't specify a detail that Claude Design shows, follow Claude Design
5. Report any contradictions at the end

Include: the page component, required types, and API call stubs.
Do not write tests unless I request them.
```

---

## 7. 품질 검증 프롬프트

Claude Design 출력을 프로덕션으로 보내기 전 최종 검증:

```
Review the current design against our design system requirements:

1. Color check: Are all colors from the tokens? List any hex values that don't match --bg*, --text*, --brand*, --success, --warning, --danger.
2. Typography check: Are only the 9 allowed type styles used? List any custom font-size/weight combinations.
3. Radius check: Any border-radius > 12px?
4. Spacing check: Any spacing values that don't match the 4px grid (0/4/8/12/16/20/24/32/40/48/64)?
5. Icon check: Are all icons from Lucide? Stroke 1.5? Sizes limited to 14/16/20/24?
6. Emoji check: Any emojis present?
7. Gradient/glow check: Any gradients, colored shadows (non-focus), or glow effects?
8. Copy check: Any emotional exclamations, emojis in text, italic phrases?

Provide a numbered list of violations (if any) with specific locations.
```

---

## 8. 자주 쓰는 컨텍스트 프리셋

긴 프롬프트를 반복하지 않도록, 자주 쓰는 문맥을 변수처럼 활용:

```
{AVATING_USER} = "온보딩을 완료한 활성 사용자, 다이아 1,240 보유, 이번 주 파견 3회 완료"
{AVATING_DARK_CARD} = "bg-bg-1 border-border rounded-md p-4 shadow-1"
{AVATING_PRIMARY_CTA} = "Primary button, size lg, with trailing ArrowRight icon"
{AVATING_MODAL_SHELL} = "Pattern E modal, max 480px, header + body + footer with secondary/primary actions"
```

---

## 팁

1. **짧은 프롬프트가 더 정확하다.** 시스템 프롬프트(노트)가 대부분의 규약을 담당하므로, 매 프롬프트에서 색상/폰트를 다시 지시하지 말 것.

2. **여러 화면을 한 프롬프트로 요청하지 말 것.** 각 화면은 별도 프로젝트로. 관련 화면끼리는 "flow"로 묶어도 되지만, 성격이 다른 화면을 한 번에 요청하면 결과가 섞여 품질이 떨어진다.

3. **2차 이후는 인라인 코멘트 우선.** 구조 변경만 채팅, 세부는 핀 댓글로.

4. **DSD가 있으면 DSD 기반 프롬프트를 써라.** 가장 통제된 결과가 나온다.

5. **"Save and try different approach"를 활용하라.** Claude Design이 저장해두므로, 실험적으로 완전히 다른 방향을 탐색할 때 원본을 잃지 않는다.
