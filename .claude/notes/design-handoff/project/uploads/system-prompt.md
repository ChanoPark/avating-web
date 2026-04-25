# AVATING DESIGN SYSTEM — Claude Design Instructions

> **NOTE**: 이 문서 전체를 Claude Design의 "Add notes" 필드에 붙여넣는다.
> 일부만 잘라서 넣으면 제약이 누락되어 Anti-AI 규약 위반 결과가 나올 수 있음.

---

## WHO THIS IS FOR

이 지시는 **아바팅(Avating)** 프로젝트의 모든 시각 자산 생성에 적용된다. 아바팅은 AI 아바타를 소개팅에 파견하고 관전하며 훈수두는 "관찰 예능형 소셜 게임" 서비스다.

---

## CORE DESIGN PHILOSOPHY

세 가지 원칙을 모든 결정의 기준으로 삼는다:

1. **OBSERVATIONAL**: 사용자는 참여자가 아닌 관찰자다. 감정적 몰입 강요 대신 데이터·숫자·사실을 전면에 둔다.
2. **RESTRAINED**: "빼는 것"이 "더하는 것"보다 항상 우선한다. 단일 브랜드 컬러만 사용한다.
3. **STRUCTURAL**: 모든 요소는 명확한 그리드와 위계를 따른다. 4px 그리드를 벗어나지 않는다.

**REFERENCE AESTHETIC**: Linear.app, Vercel.com의 감각. 개발자 도구, 관제 시스템, 분석 대시보드의 관조적 톤.

**DO NOT** reference: Tinder, Bumble, 일반 데이팅 앱의 감성적·화려한 톤.

---

## TOKENS (STRICT)

### Colors — USE ONLY THESE

```
Background (4-level):
  --bg:         #0A0E1A   (page background, deepest)
  --bg-elev-1:  #0F1420   (card surface)
  --bg-elev-2:  #161C2C   (input bg, nested surface)
  --bg-elev-3:  #1E2538   (hover/active state)

Borders:
  --border:     #1F2638
  --border-hi:  #2A3349
  --border-focus: #3B5BDB

Text (4-level):
  --text:   #E4E7EF   (primary)
  --text-2: #A1A8BC   (secondary / labels)
  --text-3: #6B7490   (meta / timestamps)
  --text-4: #434D67   (disabled only)

Brand — SINGLE POINT COLOR:
  --brand:        #5170FF   (Muted Indigo, NOT Purple)
  --brand-hover:  #6781FF
  --brand-soft:   rgba(81, 112, 255, 0.12)
  --brand-border: rgba(81, 112, 255, 0.25)

Functional signals (use sparingly):
  --success: #3FB950   (success, online, trending up)
  --warning: #D29922   (warning, busy, mid values)
  --danger:  #F85149   (error, critical)
```

### Typography — ONLY 3 FONTS

```
UI elements:    Inter Tight   (buttons, labels, headings, nav)
Body text:      Inter         (paragraphs, descriptions)
Meta/numbers:   JetBrains Mono (timestamps, codes, stats, captions)
```

### Type Scale — ONLY THESE 9 STYLES

```
display:     Inter Tight · 600 · 32px · 1.15 · LS -1px
title:       Inter Tight · 600 · 24px · 1.3  · LS -0.5px
heading:     Inter Tight · 600 · 16px · 1.4  · LS -0.2px
subheading:  Inter Tight · 500 · 14px · 1.4
ui-label:    Inter Tight · 500 · 13px · 1.5
body:        Inter · 400 · 14px · 1.5
body-sm:     Inter · 400 · 12px · 1.5
mono-meta:   JetBrains Mono · 400 · 11px · 1.4
mono-micro:  JetBrains Mono · 400 · 10px · 1.4 · LS 0.5px
```

### Radius — ONLY ≤12px

```
sm:   6px    (buttons, tags, inputs)
md:   8px    (cards, popovers)
lg:   10px   (avatar marks, icon boxes)
xl:   12px   (frames, large modals)
full: 9999px (ONLY for elements ≤28px, e.g., status dots)
```

**NEVER use radius > 12px. No `rounded-2xl`, no `rounded-3xl`.**

### Spacing — 4px Grid Only

Allowed: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. 내부 padding은 보통 8-20px 범위.

### Shadows — 3 Levels Only

```
shadow-1: 0 1px 2px rgba(0,0,0,0.3)     (cards)
shadow-2: 0 4px 12px rgba(0,0,0,0.4)    (modals, frames)
shadow-3: 0 12px 32px rgba(0,0,0,0.5)   (toasts, popovers)
focus-ring: 0 0 0 3px rgba(81,112,255,0.12)  (focus states only)
```

**NEVER use colored shadows** (purple glow, etc.) except focus-ring.
**NEVER use multiple layered shadows** (stacking 3+ shadows).

---

## PROHIBITED DECORATIONS — HARD NO

이것들은 **절대** 생성하지 않는다. 위반 시 전체 디자인이 거부된다.

### Visual prohibitions

- ❌ **보라색 그라데이션** (`linear-gradient(purple, pink)` 류) — AI스러움의 1순위 지표
- ❌ **모든 그라데이션 배경** (단색만 사용)
- ❌ **네온 글로우** (`box-shadow: 0 0 30px <color>`)
- ❌ **글래스모피즘** (`backdrop-filter: blur` 과다 사용)
- ❌ **무지개 텍스트** (`background-clip: text`로 다색)
- ❌ **떠다니는 요소** (`animation: float`, 패럴랙스)
- ❌ **확대 호버** (`scale(>1.02)`)
- ❌ **파티클, 컨페티, 폭죽 애니메이션**

### Typography prohibitions

- ❌ **Italic** (이탤릭 일체 금지)
- ❌ **Serif 폰트** (Playfair, Georgia, DM Serif 등)
- ❌ **Display 장식 폰트** (Dancing Script, Pacifico 등)
- ❌ **Bold 700+** (최대 600 semibold)
- ❌ **과도한 letter-spacing** (본문 >1px, display >3px)
- ❌ **ALL CAPS 변환** (`mono-micro` 레이블 예외 허용)

### Content prohibitions

- ❌ **모든 이모지** (✨🚀💫❤️🎉 등 UI 어디에도 금지)
- ❌ **감정 과잉 카피** ("신비로운", "마법 같은", "설렘 가득한")
- ❌ **느낌표 남용** ("지금 시작하세요!", "운명의 상대!")
- ❌ **장식용 일러스트** (캐릭터, 추상 도형)
- ❌ **스톡 이미지**

### Layout prohibitions

- ❌ **"Hero 섹션 + 3카드" 클리셰** — 가장 흔한 AI 생성 레이아웃
- ❌ **중앙 정렬 큰 제목 + 서브타이틀 + CTA** (온보딩 첫 화면 외)
- ❌ **대각선 섹션 구분**
- ❌ **비대칭·불규칙 레이아웃**

---

## REQUIRED PATTERNS

아래 패턴 중 하나에 해당하지 않는 레이아웃은 재검토한다.

### Pattern A — Auth Split (회원가입/로그인)

```
[Brand Visual + Grid BG] | [Form Panel, max 360px]
```

### Pattern B — App Shell (내부 페이지)

```
Sidebar 220px | [Header 52px / Main content]
```

### Pattern C — Wizard (순차 단계)

```
[Progress bar (shimmer on active)]
[Step label · Title · Subtitle]
[Main content]
[Back | hint | Next]
```

### Pattern D — Split View (시뮬레이션 관전)

```
[Main chat area] | [Right panel 280px]
```

### Pattern E — Modal (확인/결제)

```
max 480px · [Status badge] · Title · Body · [Secondary | Primary]
```

### Pattern F — Stats Dashboard

```
Grid of 4 stat cards: [icon + label + value + delta]
```

### Pattern G — Data List (테이블형)

```
Table with columns: Name | Type | Tags | Metric | Action
(NOT card grid — use table for comparison contexts)
```

---

## ICONS — LUCIDE ONLY

- **라이브러리**: Lucide React (exclusively)
- **Stroke**: 1.5 (Lucide default, do not change)
- **Sizes**: 14 / 16 / 20 / 24 only — nothing in between
- **Color**: `currentColor` (inherits from parent text)
- **Fill icons**: PROHIBITED except for official social brand logos (Google, Apple, GitHub)

### Canonical icon mapping (follow this, do not substitute)

```
Navigation:
  Dashboard → Activity
  Explore → Compass
  Watch → Eye
  Matching → Heart
  Messages → MessageSquare
  Settings → Settings
  Notifications → Bell
  Search → Search
  Profile → User

Actions:
  Dispatch (파견) → Send
  Intervene (훈수) → Zap
  Connect (본캐 연결) → Link
  Copy → Copy
  Confirm → Check
  Close → X
  More → MoreHorizontal

States:
  Time/Turn → Clock
  Trend up → TrendingUp
  Diamond (재화) → Gem
  Blind text → Lock
  Security → Shield
  Event → Sparkles

Avatar attributes:
  Extroversion → Users
  Sensitivity → Heart
  Enthusiasm → Flame
  Date Style → Compass
  Introvert → Moon
```

---

## COMPONENT CATALOG

다음 컴포넌트만 사용한다. 새 컴포넌트를 만들 때는 먼저 조합으로 해결 가능한지 검토.

| Component | Variants | Notes |
|-----------|----------|-------|
| Button | primary / secondary / ghost × sm / default / lg / icon | primary는 한 화면당 최대 1개 |
| Input | default / error / disabled | label + helperText + errorMessage |
| Tag | default / brand / success / warning / danger | **r-sm 고정, pill 금지** |
| AvatarMark | sizes 24/28/32/36/44 | 이니셜 2글자, 28px 이하만 circle |
| StatBar | default / compact | 0-100 값, brand color fill |
| Kbd | - | 하나의 키 = 하나의 Kbd |
| Icon | sm/default/lg/xl | 14/16/20/24 고정 |

---

## COPY TONE

### Voice principles

- **Fact-based**: "평균 호감도 64/100" (O) vs "엄청난 호감도!" (X)
- **Concise**: 한 줄에 끝. 필요하면 두 문장으로 분리.
- **Functional**: "아바타가 대화를 시작했습니다" (O) vs "드디어 첫 만남이 시작됐어요!" (X)
- **Developer-tool vibe**: `TURN 06 / 12`, `+6 지난 턴 대비`, 모노스페이스 메타

### Before → After

| ❌ Bad (AI-like) | ✅ Good (Avating) |
|------------------|-------------------|
| "🎉 운명의 상대를 만났어요!" | "호감도 임계값 돌파" |
| "💡 지금이 결정적 순간!" | "현재 +6pt 상승 중 · 개입 효과 높음" |
| "✨ 특별한 아바타 탄생!" | "당신의 아바타가 준비됐어요" |
| "아직 아바타가 없어요 🥺" | "아바타 없음 · 설문 완료 후 생성됩니다" |

### Language

- 한국어가 기본. 단, 개발자 도구 감각을 위해 상태 레이블/메타에는 **영문+Mono** 병행 허용:
  - `TURN 06`, `ONE-TIME CODE`, `STEP 2 / 4`

---

## DOMAIN GLOSSARY

생성하는 모든 UI에서 이 용어를 정확히 사용한다.

| 용어 | 영문 | 의미 |
|------|------|------|
| 회원 | Member | 인증·결제 주체 |
| 아바타 | Avatar | 회원을 대리하는 AI |
| 연결 코드 | Connect Code | Custom GPT 연동용 1회용 코드 |
| 스탯 | Stats | 아바타 성향 수치 (외향성/감성/적극성/데이트 스타일) |
| 세션 / 턴 | Session / Turn | 대화방 단위 / 메시지 교환 단위 |
| 훈수 | Intervention | 다이아 소모 대화 개입 |
| 본캐 연결 | Real Connection | 실제 1:1 채팅 개설 |
| 드라마 인젝션 | Drama Injection | 시스템 이벤트 주입 |
| 다이아 | Gem / Diamond | 유료 재화 |
| 매칭 티켓 | Match Ticket | 본캐 연결 시 소모 |

---

## OUTPUT EXPECTATIONS

- **기본 테마**: Dark mode (Phase 1은 다크 고정)
- **기본 프레임**: Desktop `1280×900`, Mobile `390×844`
- **Motion**: 단일 ease function `cubic-bezier(0.16, 1, 0.3, 1)` · 허용된 애니메이션: typing, shimmer, pulse-dot
- **한국어 폰트**: Inter/Inter Tight fallback으로 시스템 한국어 폰트 사용 (Phase 2에 Pretendard 검토)

---

## SELF-CHECK BEFORE OUTPUTTING

출력 전 스스로 확인:

- [ ] 이모지 0개인가?
- [ ] 그라데이션 0개인가?
- [ ] border-radius 최대값이 12px인가?
- [ ] 폰트 ≤3종(Inter Tight/Inter/JetBrains Mono)인가?
- [ ] 브랜드 컬러 외 색상이 기능 신호(success/warning/danger) 외로 쓰이지 않았는가?
- [ ] Italic 없는가?
- [ ] Font weight ≤600인가?
- [ ] 카피에 느낌표나 감정 과잉 표현 없는가?
- [ ] 아이콘이 모두 Lucide stroke 스타일인가?

**하나라도 실패하면 재생성한다.**
