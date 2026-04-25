---
screen: main-dashboard
version: 1.0.0
status: approved
author: design-agent
pattern: B + F + G
---

# DSD · 메인 · 탐색 대시보드

## 1. 개요

**목적**: 로그인 후 사용자가 가장 많이 보는 화면. 내 활동 요약 + 파견 대상 아바타 탐색.
**성공 지표**: 파견 전환율(아바타 리스트에서 "파견하기" 클릭), 체류 시간.

## 2. User Journey

```
Login → [Main Dashboard] → Avatar Detail / Simulation / My Avatar
```

## 3. 레이아웃 패턴

- **패턴**: `B (App Shell) + F (Stats Dashboard) + G (Data List)` 조합
- **선택 이유**: 핵심 메트릭을 상단에, 액션 대상을 테이블로. 카드 그리드 대신 "분석 대상"을 보는 관조적 레이아웃.

## 4. 레이아웃 상세

```
┌────────┬─────────────────────────────────┐
│Sidebar │ 홈 > 아바타 탐색     [⌘K] [🔔]  │
│ 220px  │ [💎 1,240]                      │
│        ├─────────────────────────────────┤
│ [Home] │                                 │
│ Explore│ ┌─────┬─────┬─────┬─────┐       │
│ Watch  │ │Stat1│Stat2│Stat3│Stat4│       │
│ Match  │ └─────┴─────┴─────┴─────┘       │
│        │                                 │
│ Profile│ 추천 아바타     [필터 칩들]     │
│ Gems   │                                 │
│ Settings│ ┌───────────────────────────┐  │
│        │ │ NAME | TYPE | TAGS | ...  │  │
│ [User] │ ├───────────────────────────┤  │
│        │ │ [avatar row]              │  │
│        │ │ [avatar row]              │  │
│        │ │ ...                       │  │
│        │ └───────────────────────────┘  │
└────────┴─────────────────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button, Input (검색), Tag, Icon, AvatarMark, Kbd

**신규**:
- `StatsCard`: 아이콘 + 라벨 + 수치 + 변화 지표 (대시보드 상단 4개)
- `AvatarListRow`: 테이블 행 (identity/type/tags/match-rate/action)
- `Sidebar`: 좌측 고정 네비게이션
- `SidebarItem`: sidebar 안의 링크 아이템
- `FilterChip`: 활성/비활성 토글 가능한 필터 칩

## 6. 디자인 토큰

- Sidebar 배경: `--bg` (darker), `border-right: --border`
- Main area 배경: `--bg-elev-1`
- Stats card: `--bg-elev-2`, `r-md`
- Avatar list: `--bg-elev-2`, `r-md`, row hover `--bg-elev-3`

## 7. 타이포그래피

- Page breadcrumb: `subheading` `--text-2` (current: `--text`)
- Stats label: `mono-meta` `--text-3` uppercase
- Stats value: `title` (22px) `--text`
- Stats delta: `mono-meta` (--success / --danger / --text-3)
- Section title: `heading` `--text`
- Table head: `mono-micro` `--text-3` uppercase
- Row name: `ui-label` `--text`
- Row handle: `mono-meta` `--text-3`

## 8. 아이콘

### Sidebar (왼쪽 메뉴)

- 대시보드: `Activity`
- 아바타 탐색: `Compass`
- 관전중: `Eye`
- 매칭: `Heart`
- 내 아바타: `User`
- 다이아: `Gem`
- 설정: `Settings`

### Header

- 검색: `Search` (+ `⌘K`)
- 알림: `Bell`
- 다이아 잔액: `Gem` (--brand)

### Stats Cards

- 파견: `Send`
- 호감도: `Heart`
- 본캐 연결: `Sparkles`
- 훈수: `Zap`

### List Actions

- 파견: `Send` (16)
- 관전: `Eye` (16)
- 필터: `Filter` (16)

## 9. 인터랙션

### Sidebar

- **클릭**: 해당 페이지로 라우팅
- **활성 상태**: 현재 페이지만 `--bg-elev-2` 배경 + `--brand` 아이콘
- **배지 숫자**: 관전중/매칭 옆에 카운트 표시

### Avatar List

- **Row hover**: `--bg-elev-3` 배경
- **Row click**: 아바타 상세 페이지로 이동
- **파견 버튼 클릭** (이벤트 버블링 중단): 파견 확인 모달 표시
- **상태 점**: online(초록) / busy(주황) / offline(회색)

### 필터

- **Chip 클릭**: 토글, 여러 개 동시 활성 가능 (복수 필터)
- **"전체" 선택 시**: 나머지 모두 해제
- **필터 적용**: 즉시 리스트 갱신 (debounce 없음, 로컬 필터)

### 검색

- `⌘K`로 커맨드 팔레트 활성화
- 검색 결과는 팔레트 내에 표시 (별도 페이지 이동 없음)

## 10. 반응형

- **Mobile (<860px)**:
  - Sidebar 숨김, 상단에 햄버거 메뉴 버튼
  - Stats card 4열 → 2×2 grid
  - Avatar list: Name + Action 열만 표시, 나머지 숨김
  - 탭 시 Name 아래에 Type, Tags 펼쳐보기

- **Tablet (860-1024px)**:
  - Sidebar 축소 (icon only, 64px)
  - 모든 stat card 표시

## 11. 접근성

- Sidebar: `<nav aria-label="메인 내비게이션">`
- Active sidebar item: `aria-current="page"`
- Stats card: `aria-label` 로 수치 + 변화 전체 읽기
- Table: `role="table"`, head `role="columnheader"`
- 상태 점: 색상 + `aria-label="온라인"` 이중 표기

## 12. 카피라이팅

### Sidebar

| 섹션 | 아이템 |
|------|--------|
| 홈 | 대시보드 |
| 홈 | 아바타 탐색 |
| 홈 | 관전중 |
| 홈 | 매칭 |
| 내 프로필 | 내 아바타 |
| 내 프로필 | 다이아 |
| 내 프로필 | 설정 |

### Stats Cards (4개)

| 카드 | 라벨 | 값 형식 | Delta 예시 |
|------|------|---------|-----------|
| 1 | 총 파견 횟수 | 정수 | +8 지난주 대비 |
| 2 | 평균 호감도 | N/100 | +3.2pt |
| 3 | 본캐 연결 | 정수 | 매칭 성공률 N% |
| 4 | 이번 주 훈수 | 정수 | -N 다이아 사용 |

### Table

| 컬럼 | 헤더 |
|------|------|
| 1 | 아바타 |
| 2 | 유형 |
| 3 | 관심사 |
| 4 | 호환도 |
| 5 | (액션) |

### 필터 칩

- 전체 / 온라인 / 내향 / 외향 / 인증

### 빈 상태 (아바타 리스트 비어있을 때)

- 제목: "추천 아바타 없음"
- 설명: "필터를 조정하거나 잠시 후 다시 확인해주세요"
- 액션: "필터 초기화" 버튼

## 13. 상태 머신

```
loading → loaded → (filter change) → loading → loaded
loaded → (row click) → navigate to detail
loaded → (dispatch click) → confirm modal → api call → success/error
```

## 14. API

- `GET /api/dashboard/stats` (Stats 4개)
- `GET /api/avatars/recommended?filter=...` (추천 리스트, 페이지네이션 cursor 기반)
- `POST /api/sessions` (파견 요청)

### 스키마

```ts
interface DashboardStats {
  totalDispatched: number;
  totalDispatchedDelta: number;
  avgAffinity: number;
  avgAffinityDelta: number;
  matches: number;
  matchRate: number;
  interventionsThisWeek: number;
  gemsUsed: number;
}

interface RecommendedAvatar {
  id: string;
  initials: string;
  name: string;
  handle: string;
  level: number;
  type: string;        // "내향 · 낭만형"
  tags: string[];
  matchRate: number;   // 0-100
  status: 'online' | 'busy' | 'offline';
  verified: boolean;
}
```

## 15. 엣지 케이스

- **Stats API 실패**: 카드별로 독립적 실패 처리, 실패한 카드만 "—" 표시
- **리스트 끝 도달**: Infinite scroll로 cursor 기반 추가 로드
- **파견 실패** (다이아 부족 등): 토스트 + 다이아 충전 페이지로 안내

## 16. 참조

- `avating-design-v2.html` Section 04
- 관련 DSD: `avatar-detail.md` (미작성), `simulation-view.md`

---

## Design Rationale

### 결정 1: 카드 그리드 대신 **테이블형 리스트**

- **이유**: 아바타는 "감성적 선택"보다 "조건 비교" 대상. 호환도/유형/태그를 한눈에 비교 가능한 테이블이 컨셉에 맞음.
- **대안**: 틴더 스타일 카드 스와이프 → 기각 (관조적 톤과 불일치)

### 결정 2: 호환도를 **% 수치 + 색상 코드**

- **이유**: 객관적 지표라는 느낌. 85%+ 초록, 70-84% 기본, <70% 주황.
- **대안**: ⭐ 별점 → 기각 (감성적 표현)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
