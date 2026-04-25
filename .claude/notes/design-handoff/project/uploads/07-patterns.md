# 07 · Layout Patterns

재사용 가능한 화면 레이아웃 패턴. 새 화면을 설계할 때는 먼저 이 패턴 중 하나에 해당하는지 검토한다.

## 패턴 A — Auth Split (인증 페이지)

**용도**: 회원가입, 로그인, 비밀번호 재설정

```
┌─────────────────┬─────────────────┐
│                 │                 │
│   Brand Visual  │   Form Panel    │
│  (Grid BG)      │   (max 360px)   │
│                 │                 │
│  - Brand mark   │   - OAuth       │
│  - Headline     │   - Divider     │
│  - Features (3) │   - Email fields│
│                 │   - Submit      │
│                 │                 │
└─────────────────┴─────────────────┘
```

### 규칙

- 모바일(<860px)에서는 Brand Visual을 숨기고 Form만 표시
- Brand Visual 영역은 반투명 그리드 배경 (`background-size: 48px`)
- Form은 중앙 정렬, max-width 360px
- OAuth 버튼이 이메일 폼보다 위에 배치

### 컴포넌트

- OAuth Button (Google, Apple) 2-3개
- Divider with "OR"
- Input (label, helperText 포함)
- Password Input (with strength meter)
- Checkbox Row (약관 동의)
- Primary Button (full width)

## 패턴 B — App Shell (내부 페이지)

**용도**: 대시보드, 탐색, 설정, 내 프로필

```
┌──────────┬──────────────────────────┐
│          │ [Breadcrumb]   [Actions] │ ← Header (52px)
│  Sidebar ├──────────────────────────┤
│  (220px) │                          │
│          │                          │
│          │   Main Content           │
│          │   (padding 28/32)        │
│          │                          │
│          │                          │
│          │                          │
│  [User]  │                          │
└──────────┴──────────────────────────┘
```

### 규칙

- Sidebar width: `220px` 고정
- Header height: `52px`
- Main content padding: `28px` (vertical) `32px` (horizontal)
- 모바일: Sidebar를 Bottom Navigation 또는 Slide Sheet로 변환

### Sidebar 구조

```
┌─────────────────────┐
│ [Brand mark] Avating│ ← Top
├─────────────────────┤
│ HOME (label)        │
│ - Item              │
│ - Item              │
│                     │
│ PROFILE (label)     │
│ - Item              │
│ - Item              │
├─────────────────────┤
│ [Avatar] Username   │ ← Bottom
│           Lv.4      │
└─────────────────────┘
```

## 패턴 C — Wizard (온보딩)

**용도**: 온보딩 4단계, 본인 인증 플로우

```
┌────────────────────────────────────┐
│  [━━━━━━━━━━━━━━━━━━━━━────────]   │ ← Progress
│                                    │
│  STEP 2 / 4 (micro label)          │
│  Title                             │
│  Subtitle                          │
│                                    │
│                                    │
│  [Main Content]                    │
│                                    │
│                                    │
│                                    │
│                                    │
├────────────────────────────────────┤
│  [← 이전]  [hint]  [다음 →]         │ ← Footer
└────────────────────────────────────┘
```

### 규칙

- Progress bar는 상단 고정, 현재 스텝은 shimmer 애니메이션
- 각 스텝은 명확한 시작/끝이 있어야 함
- 이전 버튼은 `secondary`, 다음 버튼은 `primary`
- 중앙 힌트는 `mono-meta` 스타일, `⌘↵` 같은 단축키 안내

## 패턴 D — Split View (시뮬레이션)

**용도**: 시뮬레이션 관전 화면

```
┌─────────────────────────┬───────────┐
│ [Participants] [Turn]   │           │
├─────────────────────────┤           │
│                         │  Right    │
│  Chat Area              │  Panel    │
│  (scrollable)           │  (280px)  │
│                         │           │
│                         │  - Stats  │
│                         │  - Presets│
│                         │  - Log    │
├─────────────────────────┤           │
│  [Composer]             │           │
└─────────────────────────┴───────────┘
```

### 규칙

- 좌측은 flex, 우측은 고정 280px
- 모바일에서는 우측 패널을 Bottom Sheet로 전환
- Chat area는 scrollable, composer는 하단 고정

## 패턴 E — Modal (확인/결제)

**용도**: 본캐 연결 확인, 결제 확인, 경고 모달

```
                  [X close]
┌──────────────────────────┐
│  [Status badge]          │ ← Header
│  Title                   │
│  Subtitle                │
├──────────────────────────┤
│                          │
│  [Content area]          │
│  - Summary               │
│  - Details               │
│  - Cost callout          │
│                          │
│  [Secondary] [Primary]   │
│  footnote                │
└──────────────────────────┘
```

### 규칙

- Max width: `480px`
- Header와 Body는 `border-bottom: 1px`으로 분리
- Primary/Secondary 버튼은 하단에 나란히 (flex-1로 동일 너비)
- Footnote는 `mono-meta` 스타일

## 패턴 F — Stats Dashboard (대시보드 카드)

**용도**: 내 활동 요약, 성과 지표

```
┌──────────┬──────────┬──────────┬──────────┐
│ [Icon]   │ [Icon]   │ [Icon]   │ [Icon]   │
│ Label    │ Label    │ Label    │ Label    │
│ 47       │ 64/100   │ 3        │ 21       │
│ +8 △     │ +3.2pt   │ 6.4% rate│ -153 Gem │
└──────────┴──────────┴──────────┴──────────┘
```

### 규칙

- 4개 카드 grid (모바일은 2×2)
- 라벨: `mono-meta` with leading icon 16px
- 값: `text-title` (22px semibold)
- 변화 지표: `mono-meta` with `--success`/`--danger`/`--text-3`

## 패턴 G — Data List (테이블형)

**용도**: 아바타 리스트, 매칭 기록, 결제 내역

```
┌─────────────────────────────────────────────┐
│ NAME  | TYPE   | TAGS      | RATE  | ACTION │ ← Head
├─────────────────────────────────────────────┤
│ [👤] Moonlit... | 내향 | 태그 | 87% | [파견] │
│ [👤] Spring... | 외향 | 태그 | 82% | [파견] │
│ [👤] Urban... | 외향 | 태그 | 71% | [관전] │
└─────────────────────────────────────────────┘
```

### 규칙

- Grid template: `1fr 140px 180px 100px 120px` (desktop)
- Head row: `mono-micro` uppercase
- Data row: padding `12px 16px`, hover `bg-elev-3`
- 모바일: 주요 컬럼(Name + Action)만 표시, 나머지는 숨김
- Row 클릭으로 상세 진입 가능 (cursor: pointer)

## 레이아웃 선택 가이드

새 화면을 만들 때:

| 상황 | 패턴 |
|------|------|
| 로그인/회원가입/비밀번호 | A (Auth Split) |
| 메인 앱 내부 페이지 | B (App Shell) |
| 순차적 단계가 있는 흐름 | C (Wizard) |
| 두 영역을 동시에 봐야 함 | D (Split View) |
| 단일 결정 요청 | E (Modal) |
| 주요 지표 요약 | F (Stats Dashboard) |
| 다수 항목 나열 | G (Data List) |

이 중 어느 것에도 해당하지 않으면 **새 패턴이 필요한지 재검토**한다. 대부분의 경우 위 7가지로 해결된다.

## 반응형 브레이크포인트

```css
--bp-sm:  640px;   /* 모바일 가로 */
--bp-md:  860px;   /* 태블릿 (sidebar off) */
--bp-lg:  1024px;  /* 노트북 */
--bp-xl:  1280px;  /* 데스크탑 */
```

### Tailwind

```ts
screens: {
  sm: '640px',
  md: '860px',
  lg: '1024px',
  xl: '1280px',
}
```

- **모바일 퍼스트**: 기본은 모바일 레이아웃, `md:`부터 데스크탑 변형
- 구체적 픽셀보다는 이 브레이크포인트 사용
