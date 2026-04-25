# Claude Design 온보딩 — Avating 디자인 시스템 등록 가이드

이 문서는 Claude Design의 "Set up your design system" 플로우에 아바팅 디자인 시스템을 등록하는 구체적인 절차를 담는다.

## 사전 준비

1. Claude Pro / Max / Team / Enterprise 구독 상태 확인
2. Team / Enterprise의 경우: 관리자가 Organization settings > Capabilities > Claude Design 토글 ON
3. 프로젝트 코드베이스가 GitHub에 푸시되어 있어야 함 (GitHub 연동 권장)
4. 이 디자인 킷(`avating-design-kit/`) 전체를 프로젝트에 배치 완료

## 접근 경로

1. `claude.ai` 로그인
2. 좌측 네비게이션의 **팔레트 아이콘** 클릭 → `claude.ai/design`
3. 좌하단 organization picker에서 **"Avating"** 조직 선택 (없으면 생성)
4. 온보딩 플로우 진행

## 자산 업로드 순서 (우선순위대로)

Claude Design은 업로드된 자산에서 디자인 시스템을 "추출"한다. 순서가 중요하다 — 가장 결정적인 자산을 먼저 올려야 나머지가 그 맥락에서 해석된다.

### Step 1 · 코드베이스 링크 (최우선)

**Claude Design 화면**: "Link a codebase" → GitHub 연동

**경로**: `{your-org}/avating-web` 저장소

**Claude가 읽는 파일 (자동 탐지되지만 권장 경로 명시)**:
- `src/styles/tokens.css` — 모든 토큰의 Ground Truth
- `tailwind.config.ts` — Tailwind 매핑
- `src/shared/components/ui/*.tsx` — 공용 컴포넌트
- `src/shared/icons/manifest.ts` — 아이콘 레지스트리

**주의사항**:
- 코드가 지저분하면 결과도 지저분해진다. 업로드 전 `lint` + `format` 1회 실행 권장
- Claude는 "실제 사용된" 패턴을 추출한다. 폐기된 컴포넌트는 제거하고 올릴 것

### Step 2 · 텍스트 노트 (핵심 제약 주입)

**Claude Design 화면**: "Add notes"

**붙여넣을 내용**: `claude-design/system-prompt.md`의 전체 내용.

이 노트가 Anti-AI 제약, Tone of Voice, 금지 사항을 명시적으로 전달한다. 코드만 업로드하면 Claude는 "일반적인 다크 UI" 정도로 추출할 가능성이 높으므로, 텍스트 노트로 **의도**를 명확히 전달해야 한다.

### Step 3 · 참조 완성물 (현실감 부여)

**Claude Design 화면**: "Upload reference" → HTML / 스크린샷

**업로드할 파일**:
- `reference/avating-design-v2.html` — 시각적 Ground Truth (프로토타입)
- 필요 시 화면별 스크린샷 (PNG, `1280×900` 또는 모바일 `390×844`)

공식 가이드에서도 "완성된 랜딩 페이지나 마케팅 사이트 같은 실제 예시가 컬러 팔레트 스펙만보다 더 많은 정보를 전달한다"고 명시하고 있다.

### Step 4 · 폰트 자산

**폰트 파일은 업로드하지 않아도 된다** (Google Fonts URL로 충분). 텍스트 노트에 다음을 포함:

```
Fonts (load from Google Fonts):
- Inter Tight: https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600
- Inter: https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600
- JetBrains Mono: https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500
```

### Step 5 · Figma 파일 (선택)

Figma에 디자인 시스템을 이미 구축했다면 그 파일도 업로드. 아직 없다면 스킵해도 된다 — 코드베이스 + 텍스트 노트 + HTML 참조만으로도 충분하다.

## 검증 (Publish 전 필수)

온보딩 완료 후, **반드시 다음 테스트 프롬프트로 검증**한다. 기대 결과와 다르면 텍스트 노트를 조정하고 "Remix"로 디자인 시스템을 업데이트한다.

### 검증 프롬프트 A — 기본 컴포넌트

```
Create a simple page with: a title "설정", a brand-primary button labeled "저장",
a secondary button "취소", and an input field with label "닉네임".
```

**기대 결과**:
- ✅ 배경: `#0A0E1A` (Deep Navy)
- ✅ 버튼: 6px radius, 브랜드 컬러 `#5170FF`
- ✅ 폰트: Inter Tight (UI)
- ✅ 이모지 **없음**
- ✅ 그라데이션 **없음**
- ❌ 실패 시그널: 보라 그라데이션, 큰 radius, 장식 요소

### 검증 프롬프트 B — 감정 과잉 유도 (Anti-AI 제약 테스트)

```
Create a "matching success" celebration screen where two users were matched.
```

**기대 결과**:
- ✅ 팩트 기반 카피: "호감도 임계값 돌파" 스타일
- ✅ Lucide 아이콘 (Check, Link 등)
- ✅ 차분한 다크 네이비
- ❌ 실패 시그널: 하트 이모지(❤️), 컨페티 애니메이션, "축하합니다! 🎉" 류 카피, 그라데이션

### 검증 프롬프트 C — 레이아웃 패턴

```
Create a dashboard with: sidebar navigation on the left, a top header with breadcrumb,
and a main area showing 4 stat cards in a row and a table-style list of avatars.
```

**기대 결과**:
- ✅ Sidebar 220px 고정
- ✅ Header 52px
- ✅ Stats strip 4열 grid
- ✅ 테이블형 리스트 (카드 그리드 아님)
- ❌ 실패 시그널: 카드 그리드로 아바타 표시, Hero 섹션 추가

### 실패 시 수정 방법

하나라도 실패하면:
1. "Remix" 버튼으로 디자인 시스템 챗 열기
2. 실패한 부분을 구체적으로 지적: "The last project used purple gradients. Our brand color is `#5170FF` and gradients are prohibited. See Note section 'Prohibited Decorations'."
3. 검증 프롬프트 재실행
4. 모든 프롬프트 통과 시 **"Published" 토글 ON**

## 발행 후 운영

### 팀 온보딩

- 디자이너/PM에게 이 문서 공유
- 초기 1-2주는 Claude Design 결과물을 design-agent가 DSD로 변환하는 단계를 거쳐 검증 (바로 Claude Code 핸드오프로 가지 말 것)

### 디자인 시스템 업데이트

규약이 바뀌면:
1. 코드베이스 먼저 업데이트 (`tokens.css`, `tailwind.config.ts`, 컴포넌트)
2. `claude-design/system-prompt.md` 업데이트 (해당되면)
3. Claude Design 조직 설정 → 디자인 시스템 "Open" → "Remix"
4. 변경사항을 챗으로 전달: "Updated: brand color changed from `#5170FF` to `#...`, see `src/styles/tokens.css`"
5. 검증 프롬프트 재실행
6. 통과 시 새 버전 발행

### Claude Code 핸드오프

Claude Design에서 만든 디자인을 프로덕션 코드로 옮길 때:
1. 디자인 완성 후 **"Handoff to Claude Code"** 클릭
2. 생성된 터미널 프롬프트 복사
3. Claude Code 세션에서 붙여넣기
4. Claude Code가 자동으로 design bundle fetch → README(토큰/컴포넌트 경계 포함) 읽기 → 프로젝트 컨벤션에 맞춰 스캐폴드

**권장**: 이 자동 경로를 쓰더라도, 복잡한 화면은 **먼저 DSD로 변환 후 `/dev` 에이전트로** 구현하는 것이 더 통제된 결과를 준다.

## 주의사항 체크리스트

- [ ] GitHub 저장소에 `avating-design-kit/`이 실제로 푸시되어 있는가?
- [ ] `system-prompt.md`의 내용을 **전체** 붙여넣었는가? (잘라서 넣으면 제약이 누락됨)
- [ ] `reference/avating-design-v2.html` 업로드했는가?
- [ ] 검증 프롬프트 A, B, C 모두 통과했는가?
- [ ] "Published" 토글 ON 했는가?
- [ ] Enterprise: RBAC로 "design system editor" 역할을 지정했는가?

## 알려진 제약 (Research Preview 기준)

- 현 시점 Claude Design은 **완벽한 디자인 시스템 준수를 보장하지 않는다**. 검증 워크플로우(DSD 변환 단계)를 거치는 것을 권장.
- 인라인 댓글이 간혹 Claude에 전달되기 전 사라지는 이슈가 있다 — 이 경우 피드백을 챗에 직접 붙여넣을 것.
- Collaboration 기능은 아직 제한적 (완전한 실시간 멀티플레이어 아님).
