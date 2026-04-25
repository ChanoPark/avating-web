# 04 · Spacing · Radius · Shadow

## Spacing — 4px 그리드

모든 간격은 **4의 배수**를 따른다. 3px, 5px, 7px 같은 값은 사용하지 않는다.

### Scale

| 토큰 | rem | px | 주요 용도 |
|------|-----|-----|-----------|
| `space-0` | 0 | 0 | |
| `space-1` | 0.25rem | 4 | 아이콘-텍스트 최소 간격 |
| `space-2` | 0.5rem | 8 | 버튼 내부 패딩, 태그 간격 |
| `space-3` | 0.75rem | 12 | 입력 필드 간격, 작은 카드 패딩 |
| `space-4` | 1rem | 16 | 카드 패딩, 섹션 내부 간격 |
| `space-5` | 1.25rem | 20 | 모달 패딩, 큰 카드 패딩 |
| `space-6` | 1.5rem | 24 | 섹션 간격 |
| `space-8` | 2rem | 32 | 레이아웃 간격 |
| `space-10` | 2.5rem | 40 | 페이지 섹션 간격 |
| `space-12` | 3rem | 48 | 큰 페이지 섹션 |
| `space-16` | 4rem | 64 | 최대 섹션 구분 |

### 규칙

- **컴포넌트 내부**: `space-2` ~ `space-5`
- **컴포넌트 간**: `space-3` ~ `space-6`
- **섹션 간**: `space-8` ~ `space-16`
- **페이지 여백** (desktop): `space-8` (32px)
- **페이지 여백** (mobile): `space-5` (20px)

## Layout — Frame & Container

### Frame Sizes

| 디바이스 | Size | 용도 |
|----------|------|------|
| Desktop | `1280 × 900` | 기본 데스크탑 디자인 |
| Laptop | `1024 × 720` | 노트북 대응 |
| Tablet | `768 × 1024` | 태블릿 (포트레이트) |
| Mobile | `390 × 844` | iPhone 15 Pro 기준 (React Native 설계 기준) |

### Content Max Width

| 용도 | Max Width |
|------|-----------|
| 일반 페이지 콘텐츠 | `1152px` |
| 인증 페이지 폼 | `360px` |
| 모달 | `480px` |
| Chat 메시지 버블 | `78%` (부모 기준) |

### Sidebar

| 요소 | Width |
|------|-------|
| Desktop 고정 사이드바 | `220px` |
| 시뮬레이션 우측 패널 | `280px` |
| Mobile | 사이드바 없음 (Bottom Sheet로 전환) |

## Border Radius — 4단계만

**12px 초과 radius 사용 금지.** 과도한 둥근 모서리는 캐주얼/아동용 느낌을 주어 브랜드 톤과 맞지 않는다.

| 토큰 | Value | 용도 |
|------|-------|------|
| `r-sm` | 6px | 버튼, 작은 태그, 입력 필드, 작은 배지 |
| `r-md` | 8px | 카드, 팝오버, 모달 내부 요소 |
| `r-lg` | 10px | Avatar Mark, 아이콘 박스 |
| `r-xl` | 12px | 프레임, 큰 모달, 대시보드 카드 |
| `r-full` | 9999px | 원형 배지, 아바타 썸네일 (28px 이하), 상태 점 |

### 규칙

- **버튼은 무조건 `r-sm` (6px)** — Linear/Vercel 스타일
- **태그는 `r-sm` (6px)** — radius-full 사용 금지 (pill 형태 금지)
- **카드는 `r-md` ~ `r-xl`**
- 원형은 `r-full` 써도 되지만 **크기 제한** (28px 이하만)

### 금지된 radius 조합

- ❌ 비대칭 radius (`rounded-tl-lg rounded-br-sm` 같은 패턴)
- ❌ 컨테이너 전체가 pill인 카드
- ❌ 아이콘 컨테이너를 원형으로 (항상 `r-sm` or `r-md` 사각형)

## Shadow — 3단계 + 포커스 링

기능적 용도만. 글로우/네온 효과는 전면 금지.

| 토큰 | Value | 용도 |
|------|-------|------|
| `shadow-1` | `0 1px 2px rgba(0,0,0,0.3)` | 일반 카드, 호버 상태 |
| `shadow-2` | `0 4px 12px rgba(0,0,0,0.4)` | 모달, 팝오버, 프레임 |
| `shadow-3` | `0 12px 32px rgba(0,0,0,0.5)` | Toast, Dropdown 최상단 |
| `focus-ring` | `0 0 0 3px rgba(81,112,255,0.12)` | 입력/버튼 포커스 |

### 규칙

- **다중 그림자 중첩 금지** (여러 shadow를 쉼표로 연결하는 케이스)
- **컬러 그림자 금지** (`rgba(81, 112, 255, ...)`처럼 브랜드색 그림자는 포커스 링 외 금지)
- **Inset shadow 금지** (`box-shadow: inset ...`은 디자인 톤과 맞지 않음)
- **Text shadow 금지**

## Z-index 스케일

```css
--z-base:       0;   /* 기본 */
--z-dropdown:   10;  /* Dropdown, Select */
--z-sticky:     20;  /* Sticky header */
--z-fixed:      30;  /* 고정 네비게이션 */
--z-modal-bg:   40;  /* 모달 배경 (dim) */
--z-modal:      50;  /* 모달 콘텐츠 */
--z-popover:    60;  /* 팝오버 (모달 위) */
--z-toast:      70;  /* Toast (최상단) */
--z-tooltip:    80;  /* Tooltip (가장 위) */
```

## Transition — 절제된 모션

### 타이밍

| 토큰 | Value | 용도 |
|------|-------|------|
| `duration-fast` | `120ms` | 버튼 호버, 색상 전환 |
| `duration-base` | `200ms` | 카드 호버, 드롭다운 열기/닫기 |
| `duration-slow` | `400ms` | 모달 진입/이탈, 페이지 전환 |

### Easing

```css
--ease: cubic-bezier(0.16, 1, 0.3, 1);  /* ease-out, Linear 스타일 */
```

**하나의 ease 함수만 사용한다.** 다양한 bezier 커브 금지 (spring, bounce 등).

### 허용되는 애니메이션

- ✅ Color / Background transition (버튼 호버 등)
- ✅ Opacity / Transform 기반 fade
- ✅ Typing indicator (점 3개 bounce)
- ✅ Shimmer (로딩 진행바)
- ✅ Pulse (라이브 상태 표시)

### 금지된 애니메이션

- ❌ `animation: float` (떠다니는 효과)
- ❌ `animation: heartbeat` (확대축소 반복)
- ❌ `animation: glow` (빛나는 효과)
- ❌ Scale 1.05 이상 확대 효과
- ❌ Rotate 애니메이션 (loading spinner 제외)
- ❌ 파티클, 컨페티, 폭죽

## 사용 예시

### 대시보드 카드

```tsx
<div className="
  bg-[var(--bg-elev-1)]
  border border-[var(--border)]
  rounded-xl
  shadow-[var(--shadow-2)]
  p-6
">
  {/* 내용 */}
</div>
```

### 입력 포커스

```tsx
<input className="
  border border-[var(--border-hi)]
  rounded-sm
  focus:border-[var(--brand)]
  focus:shadow-[var(--focus-ring)]
  transition-all duration-fast ease-out
" />
```

### 섹션 레이아웃

```tsx
<section className="py-12">
  <div className="max-w-[1152px] mx-auto px-8">
    <h2 className="text-title mb-6">섹션 제목</h2>
    <div className="space-y-4">{/* 카드들 */}</div>
  </div>
</section>
```
