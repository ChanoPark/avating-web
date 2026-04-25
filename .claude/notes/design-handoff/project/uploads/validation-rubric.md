# Claude Design 출력 검증 루브릭

Claude Design이 생성한 결과물이 아바팅 디자인 시스템을 준수하는지 체크하는 객관적 기준.

이 루브릭은 두 가지 용도로 쓴다:
1. **사람이 검증**: 디자이너/PM이 Claude Design 출력을 보고 승인/재요청 결정
2. **AI가 검증**: design-agent 또는 verification-agent가 자동 리뷰

---

## 채점 방식

각 항목은 **Pass / Fail** 이진 판정. 총 30개 항목.

- **30/30 통과**: 프로덕션 사용 가능 (DSD 변환 → 구현으로 이관)
- **25-29 통과**: 경미한 수정 요청 (Claude Design 인라인 코멘트로 해결)
- **20-24 통과**: 구조적 수정 필요 (채팅으로 전면 재요청)
- **<20 통과**: 디자인 시스템 자체 재설정 필요 (Remix로 시스템 업데이트 후 재시도)

---

## Tier 1 · BLOCKING (하나라도 Fail이면 즉시 재생성)

이 항목들은 **Anti-AI Aesthetics 위반**이다. 단 하나도 허용되지 않는다.

| # | 검증 항목 | Pass 조건 |
|---|----------|-----------|
| 1 | 보라 그라데이션 | `linear-gradient` 계열 0개 |
| 2 | 네온 글로우 | `box-shadow`에 `rgba(81,112,255,...)` 같은 컬러 그림자 0개 (focus-ring 예외) |
| 3 | 이모지 | UI 어디에도 이모지 0개 (✨🚀❤️💫🎉 등) |
| 4 | Radius >12px | `border-radius`가 12px 초과하는 요소 0개 |
| 5 | 감정 과잉 카피 | "신비로운/마법/설렘/운명" 등 감정어 0개 · 느낌표 남용 0개 |
| 6 | Italic 텍스트 | `font-style: italic` 사용 0개 |
| 7 | Scale 호버 확대 | `transform: scale(>1.02)` 호버 0개 |
| 8 | 파티클/컨페티 | 떠다니는 장식 애니메이션 0개 |

---

## Tier 2 · NON-CONFORMANCE (수정 요청)

다수 위반 시 재요청, 1-2개 위반 시 인라인 코멘트로 교정.

### Color

| # | 항목 | Pass 조건 |
|---|------|-----------|
| 9 | 배경색 | `--bg`, `--bg-elev-1`, `--bg-elev-2`, `--bg-elev-3` 외 배경 0개 |
| 10 | 포인트 컬러 단일성 | `--brand` 외의 강조색 사용 0개 (success/warning/danger는 기능 신호로만) |
| 11 | 텍스트 색상 | 4단계 (`--text`, `--text-2`, `--text-3`, `--text-4`) 외 텍스트 컬러 0개 |

### Typography

| # | 항목 | Pass 조건 |
|---|------|-----------|
| 12 | 폰트 패밀리 | Inter Tight / Inter / JetBrains Mono 외 폰트 0개 |
| 13 | 타입 스케일 | 9개 정의된 스타일만 사용 — 임의의 font-size/weight 조합 0개 |
| 14 | Font weight | 700+ weight 0개 (최대 600) |

### Layout

| # | 항목 | Pass 조건 |
|---|------|-----------|
| 15 | 패턴 준수 | A~G 중 하나의 패턴에 명확히 해당 |
| 16 | Hero+3카드 클리셰 | 이 클리셰가 의도치 않게 사용되지 않음 |
| 17 | 4px 그리드 | 모든 spacing이 4의 배수 (3, 5, 7, 15, 25 등의 값 0개) |

### Components

| # | 항목 | Pass 조건 |
|---|------|-----------|
| 18 | 버튼 스타일 | primary/secondary/ghost 3종 이내 · radius 6px |
| 19 | Primary 버튼 개수 | 한 화면에 최대 1개 |
| 20 | Input 포커스 | focus-ring이 `rgba(81,112,255,0.12)` 브랜드 soft tone |
| 21 | Tag 형태 | radius-sm (pill 아님), 11px mono-meta 폰트 |
| 22 | AvatarMark | 이니셜 2글자, 28px 초과는 square만 |

### Icons

| # | 항목 | Pass 조건 |
|---|------|-----------|
| 23 | Lucide 전용 | 다른 아이콘 라이브러리 섞임 0개 |
| 24 | Stroke 1.5 | 모든 stroke 아이콘이 1.5 weight |
| 25 | 아이콘 사이즈 | 14 / 16 / 20 / 24 중 하나만 사용 |
| 26 | Fill vs Stroke | Fill 아이콘은 소셜 로고(Google/Apple/GitHub)만, 나머지 모두 stroke |
| 27 | 공식 매핑 준수 | 기능 대비 지정된 아이콘 사용 (예: 파견=Send, 훈수=Zap, 다이아=Gem) |

---

## Tier 3 · QUALITY (개선 제안)

위반이어도 블로킹은 아니지만, 품질 향상 기회.

| # | 항목 | Pass 조건 |
|---|------|-----------|
| 28 | 정보 밀도 | 개발자 도구 감각 — 여백 과다하지 않음, 데이터 밀도 적절 |
| 29 | Mono 메타 활용 | 타임스탬프/수치/ID 등이 `font-mono` 스타일로 표기 |
| 30 | 접근성 | 대비 4.5:1 이상, 폰트 크기 ≥11px, focus 상태 명확 |

---

## 검증 워크플로우

### 1. 빠른 스크리닝 (30초)

Claude Design 출력을 받자마자 Tier 1 (1-8번)만 확인:
- ✅ 통과 → Tier 2 검증으로
- ❌ 실패 → 즉시 재요청 (시스템 프롬프트 문제 가능성)

### 2. 상세 검증 (3-5분)

Tier 2 (9-27번) 순차 확인:
- 모두 통과 → Tier 3로
- 1-2개 실패 → 해당 요소에 인라인 코멘트
- 3개 이상 실패 → 채팅으로 구조적 수정 요청
- 5개 이상 실패 → 디자인 시스템 설정 문제. "Remix"로 시스템 업데이트 후 재시도

### 3. 품질 검토 (선택)

Tier 3 (28-30번)은 프로덕션 직전 1회만 확인.

---

## 자동 검증 체크리스트 (AI용)

design-agent 또는 verification-agent에게 전달할 때 사용:

```
Review this Claude Design output against the Avating validation rubric:

Count violations in each tier:

Tier 1 (BLOCKING) — list each occurrence with location:
1. Purple gradients: [count + locations]
2. Neon glows: [count + locations]
3. Emojis: [count + locations]
4. Radius >12px: [count + locations]
5. Emotional copy: [count + quotes]
6. Italic text: [count + locations]
7. Scale hover >1.02: [count + locations]
8. Particle/confetti animations: [count + locations]

Tier 2 (NON-CONFORMANCE) — list failing items only:
[items 9-27 with Pass/Fail]

Tier 3 (QUALITY) — brief notes only

Final verdict:
- Tier 1 any fail → REJECT (regenerate)
- Tier 2 fails 1-2 → INLINE COMMENT (list specific edits)
- Tier 2 fails 3-5 → STRUCTURAL REVISION (rewrite prompt)
- Tier 2 fails 6+ → SYSTEM REMIX (update design system)
- All pass → APPROVE (proceed to DSD conversion)
```

---

## 승인 후 다음 단계

✅ All Tier 1 + Tier 2 통과 시:

1. **Claude Design URL 저장** (`design/claude-design-outputs/{screen-name}.md`에 링크 기록)
2. **DSD 작성 요청**: `/design Claude Design 결과를 {screen-name} DSD로 변환해줘 (URL: ...)`
3. **DSD 리뷰** → `status: approved`
4. **구현**: `/dev DSD 기반으로 구현해줘`

Claude Design의 "Handoff to Claude Code" 버튼을 바로 쓰는 것보다 **DSD 변환 단계를 거치는 것**이 더 안전하다. DSD는:
- 카피라이팅을 확정
- API 의존성을 명시
- 엣지 케이스를 정리
- 접근성 요구사항을 문서화

Claude Design은 이 모든 것을 자동 처리하지 못하므로, DSD에서 보완해야 한다.
