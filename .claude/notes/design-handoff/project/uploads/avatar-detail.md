---
screen: avatar-detail
version: 1.0.0
status: approved
author: design-agent
pattern: B + F
---

# DSD · 아바타 상세

## 1. 개요

**목적**: 대시보드 리스트에서 아바타를 클릭했을 때 상세 정보 확인 및 파견/관전 결정.
**성공 지표**: 상세 뷰 → 파견 전환율, 체류 시간.

## 2. User Journey

```
Main Dashboard → [Avatar Detail] → Dispatch Confirm → Simulation
                                 → Watch ongoing sim (if any)
                                 → Back to list
```

## 3. 패턴

`B (App Shell)` 내부에서 `F (Stats)` 응용.

## 4. 레이아웃

```
┌────────┬──────────────────────────────────────┐
│Sidebar │ 홈 > 탐색 > Moonlit Narrator   [⋯]   │
│        ├──────────────────────────────────────┤
│        │                                      │
│        │ ┌──────────────────────────────────┐ │
│        │ │ [MN] Moonlit Narrator ● online   │ │
│        │ │ @moonlit · Lv.6                  │ │
│        │ │ [내향·낭만형]   [인증]           │ │
│        │ │                        [파견 →]   │ │
│        │ └──────────────────────────────────┘ │
│        │                                      │
│        │ ┌──────┬──────┬──────┬──────┐       │
│        │ │ 매칭 │ 호감 │ 세션 │ 태그 │       │
│        │ │ 14회 │ 71avg│ 47회 │ 8개  │       │
│        │ └──────┴──────┴──────┴──────┘       │
│        │                                      │
│        │ Stats                                │
│        │ ┌──────────────────────────────────┐ │
│        │ │ [Users] 외향성    ▂▂▂░ 32       │ │
│        │ │ [Heart] 감성      ▇▇▇▆ 78       │ │
│        │ │ [Flame] 적극성    ▃▃▃░ 45       │ │
│        │ │ [Compass] 스타일   ▅▅▅▃ 61       │ │
│        │ └──────────────────────────────────┘ │
│        │                                      │
│        │ Affinity Tags                        │
│        │ [심야 산책] [독립 서점] [에세이]     │
│        │ [로우파이 음악] [혼영]               │
│        │                                      │
│        │ 호환도 분석                          │
│        │ ┌──────────────────────────────────┐ │
│        │ │ 당신과 87% 호환                  │ │
│        │ │ ▇▇▇▇▇▇▇▇▆░                     │ │
│        │ │ 공통 관심사: 3 / 6 · 성향 근접도 │ │
│        │ │ 0.82                             │ │
│        │ └──────────────────────────────────┘ │
│        │                                      │
│        │ 최근 활동                            │
│        │ ┌──────────────────────────────────┐ │
│        │ │ 2시간 전 · 세션 종료 · 호감 74   │ │
│        │ │ 어제    · 세션 시작              │ │
│        │ │ 2일 전  · 매칭 성공 · 본캐 연결  │ │
│        │ └──────────────────────────────────┘ │
└────────┴──────────────────────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button, AvatarMark, Tag, StatBar, Icon, Kbd

**신규**:
- `CompatibilityMeter`: 호환도 % + 근거 지표 표시. StatBar의 특수 variant로 볼 수도 있으나 "% + 세부 breakdown"이 달라 분리 제안.
- `ActivityLog`: 시간 역순 이벤트 리스트 (mono-meta 타임스탬프 + 설명).

## 6. 디자인 토큰

- 프로필 헤더 카드: `--bg-elev-1`, `r-md`, padding `space-5`
- Stats strip (4개): 각 카드 `--bg-elev-2`, `r-md`, padding `space-4`
- Activity log: `--bg-elev-2`, `r-md`, row hover `--bg-elev-3`

## 7. 타이포그래피

| 요소 | 스타일 |
|------|--------|
| 아바타 이름 (헤더) | `title` (24px) |
| 핸들/레벨 | `mono-meta` `--text-3` |
| Stats strip 레이블 | `mono-micro` uppercase |
| Stats strip 값 | `title` 600 |
| 섹션 제목 (Stats/Tags/..) | `heading` |
| Activity 타임스탬프 | `mono-meta` `--text-3` |

## 8. 아이콘

| 위치 | Lucide |
|------|--------|
| 브레드크럼 | `ArrowRight` (chevron 대신) 작게 |
| 파견 CTA | `Send` |
| 관전 (소개팅 중인 경우) | `Eye` |
| 더보기 메뉴 | `MoreHorizontal` |
| Stats strip 아이콘 | `Heart`, `MessageSquare`, `Sparkles`, `Tag` |
| Stats 레이블 | 온보딩 완료 DSD와 동일 매핑 |

## 9. 인터랙션

- **"파견" 클릭**: 
  - 이미 다른 세션 중이면 경고 모달 "내 아바타가 이미 파견 중입니다. 계속하시겠어요?"
  - 정상이면 파견 확인 모달 (비용 확인 · 5 다이아) → 확인 → 세션 생성 → `/simulation/{id}` 로 이동
- **"관전" (이 아바타가 소개팅 중인 경우)**: `/simulation/{id}?spectate=true`로 이동
- **더보기 메뉴**: 차단, 신고, 공유 옵션
- **Activity log 클릭**: 해당 세션 결과 페이지로 이동

## 10. 반응형

- Mobile: Stats strip 4열 → 2×2 grid
- 프로필 헤더: AvatarMark를 상단 중앙으로, 정보는 아래로 재배치
- 파견 버튼은 하단 고정 (sticky)

## 11. 접근성

- 페이지 로드 시 이름으로 포커스 (`tabIndex={-1}` + programmatic focus)
- `aria-labelledby`로 섹션 제목 연결
- 호환도 meter: `aria-label="당신과 87% 호환"`

## 12. 카피라이팅

| 위치 | 텍스트 |
|------|--------|
| 브레드크럼 | 홈 · 탐색 · {아바타 이름} |
| 프로필 액션 | 파견 |
| (소개팅 중일 때) | 관전 |
| Stats strip 레이블 (4개) | 누적 매칭 · 평균 호감 · 총 세션 · 관심사 |
| 섹션 제목 | Stats · Affinity Tags · 호환도 분석 · 최근 활동 |
| 호환도 제목 | 당신과 {n}% 호환 |
| 호환도 세부 | 공통 관심사: {n} / 6 · 성향 근접도 {x.xx} |
| (본인 아바타인 경우) | 당신의 아바타입니다 (파견 버튼 비활성) |

### 상태별 라벨

- `status=online`: 초록 점 + 없음 (시각만)
- `status=busy`: 주황 점 + `"소개팅 중 · 관전 가능"`
- `status=offline`: 회색 점 + 없음

## 13. 상태 머신

```
loading → loaded (avatar data) → idle
idle → (dispatch click) → check session state
  → (user has active session) → confirm dialog
  → (all clear) → dispatch confirm modal → api call → redirect
idle → (watch click, avatar is busy) → redirect to simulation (spectator mode)
```

## 14. API

- `GET /api/avatars/{id}` — 아바타 상세
- `GET /api/avatars/{id}/compatibility?with=me` — 호환도 계산
- `GET /api/avatars/{id}/activity?limit=10` — 최근 활동
- `POST /api/sessions` — 세션 생성 (body: { myAvatarId, partnerAvatarId })

### 스키마

```ts
interface AvatarDetail {
  id: string;
  initials: string;
  name: string;
  handle: string;
  level: number;
  type: string;
  verified: boolean;
  status: 'online' | 'busy' | 'offline';
  currentSessionId?: string;  // busy일 때만
  stats: { extroversion: number; sensitivity: number; enthusiasm: number; dateStyle: number };
  tags: string[];
  metrics: { totalMatches: number; avgAffinity: number; totalSessions: number; tagCount: number };
}

interface Compatibility {
  overall: number;       // 0-100
  commonTagsCount: number;
  commonTagsTotal: number;
  statsSimilarity: number;  // 0.00-1.00
}

interface ActivityEvent {
  timestamp: string;
  type: 'session-start' | 'session-end' | 'match' | 'real-connection';
  summary: string;
  relatedId?: string;   // 세션 id 등
}
```

## 15. 엣지 케이스

- **차단한 아바타 접근**: 404 대신 "차단된 아바타입니다" 페이지
- **탈퇴한 아바타**: 프로필 영역에 "탈퇴한 사용자" 뱃지 + 파견 버튼 비활성
- **본인 아바타 접근**: 파견 버튼 대신 "편집" 버튼 (→ `/my-avatar`)
- **API 지연**: 스켈레톤 표시, 3초 이상 시 "연결이 느립니다" 안내
- **호환도 0% 또는 계산 실패**: 섹션 전체 비표시 (대신 "호환도 측정 불가" 메시지 안내)

## 16. 참조

- 관련 DSD: `main-dashboard.md` (진입점), `simulation-view.md` (다음 단계)
- `avating-design-v2.html` Section 04 (리스트의 아바타 Row 참조)

---

## Design Rationale

### 결정: Stats strip을 **최상단 대신 중단**에 배치

- **이유**: 최상단은 "누구인지"가 더 중요 (이름/핸들/상태). 수치는 맥락 설정 후에 나오는 게 자연스러움.
- **대안**: 수치 먼저 → 기각 (차갑고 건조한 인상)

### 결정: 호환도를 % 단일 수치 + breakdown

- **이유**: 단일 % 숫자는 직관적이나 근거가 없으면 불신 유발. breakdown(공통 관심사 개수, 성향 근접도)으로 이해 도움.
- **대안**: 별점 / 레이더 차트 → 기각 (별점=감성적, 레이더=과도한 복잡도)

### 결정: 최근 활동을 **공개**

- **이유**: 이 아바타가 얼마나 활발한지, 매칭 패턴이 있는지 관찰 가능 — 관조적 컨셉에 부합.
- **대안**: 프라이버시 우려로 비공개 → 기각 (아바타의 활동은 AI 가상 활동이므로 공개 OK)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
