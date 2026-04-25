---
screen: onboarding-complete
version: 1.0.0
status: approved
author: design-agent
pattern: C
---

# DSD · 온보딩 · Complete (Step 4)

## 1. 개요

**목적**: 생성된 아바타의 스탯과 태그를 확인하고, 필요 시 조정한 뒤 탐색으로 진입.
**성공 지표**: 확인 후 탐색 진입율 (재조정 없이 승인 → 95% 목표).

## 2. User Journey

```
Connect Code → (GPT 대화 완료 · polling) → [Complete] → Main Dashboard
```

## 3. 패턴

`C (Wizard)` Step 4 — 온보딩의 마지막 단계.

## 4. 레이아웃

```
┌──────────────────────────────────────┐
│ [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]    │  (4/4 done)
│ STEP 4 / 4 · 완료                     │
│                                      │
│ 당신의 아바타가 준비됐어요             │
│ 아래 스탯과 태그는 매칭 정확도에 영향  │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ [HW] hyunwoo                    │ │
│ │ @hyunwoo · Lv.1 · [내향·분석형]  │ │
│ │ ────────────────────────────     │ │
│ │ [Users] 외향성       ▂▂▂░░░░ 32 │ │
│ │ [Heart] 감성 지수    ▇▇▇▇▇▆░ 78 │ │
│ │ [Flame] 연애 적극성  ▃▃▃▃░░░ 45 │ │
│ │ [Compass] 데이트스타일▅▅▅▅▃░ 61 │ │
│ │ ────────────────────────────     │ │
│ │ AFFINITY TAGS                    │ │
│ │ [심야 산책] [독립 서점] [에세이]  │ │
│ │ [로우파이 음악] [혼영]           │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [프로필 수정]         [탐색 시작 →]   │
└──────────────────────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button, AvatarMark, Tag, StatBar, Icon, Kbd

**신규 불필요** — 모두 카탈로그 컴포넌트로 조합.

## 6. 디자인 토큰

- 아바타 프로필 카드: `--bg-elev-2`, `r-lg`, border `--border`
- 카드 내부 구분선: `border-t --border`
- 카드 padding: `space-5` (20px)

## 7. 타이포그래피

| 요소 | 스타일 |
|------|--------|
| Step label | `mono-micro` |
| 메인 제목 | `title` (24px) |
| 서브 | `body` `--text-2` |
| AvatarMark 옆 이름 | `subheading` |
| 핸들/레벨 | `mono-meta` `--text-3` |
| "AFFINITY TAGS" 섹션 레이블 | `mono-micro` uppercase `--text-3` |

## 8. 아이콘

| 위치 | Lucide |
|------|--------|
| 외향성 | `Users` |
| 감성 지수 | `Heart` |
| 연애 적극성 | `Flame` |
| 데이트 스타일 | `Compass` |
| CTA trailing | `ArrowRight` |
| (수정 버튼에 아이콘 불필요) |

아이콘 색상: 모두 `--text-3` (스탯 레이블 계층).

## 9. 인터랙션

- **"탐색 시작"**: `/dashboard`로 라우팅 + 온보딩 완료 상태 서버 업데이트
- **"프로필 수정"**: 설문(Step 2)으로 돌아가기. 기존 답변 pre-fill.
- **StatBar 렌더**: 페이지 진입 시 0%에서 타겟%로 애니메이션 (400ms, stagger 50ms)
- **Tag 클릭**: 비활성 (이 화면에서는 조회만)

## 10. 반응형

- Mobile: 카드 padding 축소 (`space-4`), StatBar 가로폭 full
- 버튼 2개는 세로 스택 ("탐색 시작"이 위, "프로필 수정"이 아래, full width)

## 11. 접근성

- StatBar 4개: 순서대로 focus 가능, `aria-label`에 "외향성 32 / 100" 형태
- 태그 리스트: `role="list"` / `role="listitem"`
- 진행 완료: `aria-live="polite"`로 "아바타 생성 완료" 1회 알림

## 12. 카피라이팅

| 위치 | 텍스트 |
|------|--------|
| Step label | STEP 4 / 4 · 완료 |
| 제목 | 당신의 아바타가 준비됐어요 |
| 서브 | 아래 스탯과 태그는 매칭 정확도에 영향을 줍니다. 언제든 프로필에서 재조정할 수 있어요. |
| 유형 태그 | {유형명} (설문 결과에서 자동 도출 — 예: "내향 · 분석형") |
| AFFINITY TAGS 섹션 | AFFINITY TAGS |
| 수정 버튼 | 프로필 수정 |
| CTA | 탐색 시작 |

### 유형 자동 도출 규칙 (참고용)

| 스탯 조합 | 유형명 |
|-----------|--------|
| 외향성 <40 + 감성 >65 | 내향 · 낭만형 |
| 외향성 <40 + 적극성 <50 | 내향 · 분석형 |
| 외향성 >65 + 감성 >60 | 외향 · 낙관형 |
| 외향성 >65 + 적극성 >65 | 외향 · 도전형 |
| (중간대) | 균형형 |

## 13. 상태 머신

```
arrived → render-stats (animation) → idle
idle → (CTA) → saving → redirect to dashboard
idle → (edit) → redirect to survey step
```

## 14. API

- `GET /api/onboarding/avatar` — 생성된 아바타 정보
- `POST /api/onboarding/complete` — 온보딩 완료 처리 (사용자 `onboardingState = 'completed'` 변경)

### 스키마

```ts
interface GeneratedAvatar {
  initials: string;
  name: string;
  handle: string;
  level: 1;
  type: string;           // e.g., "내향 · 분석형"
  stats: {
    extroversion: number;   // 0-100
    sensitivity: number;
    enthusiasm: number;
    dateStyle: number;
  };
  tags: string[];         // 최대 6개
}
```

## 15. 엣지 케이스

- **GPT 대화가 부실했던 경우**: 스탯 모두 50 근처 + 태그 3개 이하 → 별도 안내 "설문을 다시 해보시는 걸 권장드려요" + "수정" 버튼 강조
- **태그가 너무 많이 생성된 경우 (>6개)**: 상위 6개만 표시, 나머지는 프로필 편집에서 확인 가능
- **이미 온보딩 완료 후 재접근**: 수정 모드로 전환 (CTA 문구 "저장하고 돌아가기"로 변경)

## 16. 참조

- `avating-design-v2.html` Section 03 (Step 4 프리뷰)
- 관련 DSD: `onboarding-connect.md` (직전 단계), `main-dashboard.md` (다음 단계), `my-avatar.md` (프로필 수정)

---

## Design Rationale

### 결정: StatBar 애니메이션 (stagger)

- **이유**: 4개 스탯이 0에서 타겟으로 동시 차오르면 시각적 피로. 50ms stagger로 순차 애니메이션 → 관조적 톤과 맞으면서도 "생성 완료"의 의식감.
- **대안**: 즉시 표시 / 폭죽 애니메이션 → 각각 밋밋함, AI스러움으로 기각.

### 결정: 유형명을 자동 도출 (사용자가 선택 X)

- **이유**: "내향 · 분석형" 같은 태그는 **사용자가 자신의 성향을 관찰**하는 기능. 사용자가 스스로 붙이면 의미가 없음.
- **대안**: 사용자가 자기 유형 선택 → 기각 (관조적 컨셉과 불일치)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
