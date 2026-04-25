---
screen: matching-confirm
version: 1.0.0
status: approved
author: design-agent
pattern: E
---

# DSD · 본캐 연결 확인

## 1. 개요

**목적**: 호감도 75+ 달성 시 실제 1:1 연결 수락 여부를 확정.
**성공 지표**: 수락률, 본인 인증 완료율, 매칭 티켓 사용 전환율.

## 2. User Journey

```
Simulation (turn 12 + affinity >= 75) → [Matching Confirm] → Identity Verify → Real Chat
                                                          → Later (dismiss)
```

## 3. 패턴

`E (Modal)`.

## 4. 레이아웃

```
                                            [X]
┌─────────────────────────────────────┐
│ [✓ 호감도 임계값 돌파]               │
│ 본캐 연결 가능                        │
│ 두 아바타의 최종 호감도 87 · 상위 12% │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [HW] hyunwoo  [→]  [SP] spring  │ │
│ │       @hyunwoo         @spring  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Details                             │
│ 진행 턴             12 / 12         │
│ 최종 호감도         87 (초록)       │
│ 공통 관심사         독립서점 · 심야..│
│ 사용한 훈수         3회 · -21 💎    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 연결 비용                        │ │
│ │ 매칭 티켓 1 [🎫]                 │ │
│ │ (상대 수락 시에만 차감)           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [나중에]  [본인 인증 후 연결 →]      │
│                                     │
│ 본인 인증(휴대폰)이 필요합니다...     │
└─────────────────────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button, Icon, AvatarMark, Tag

**신규**:
- `StatusBadge`: 제목 위 상태 뱃지 (success variant)
- `DetailRow`: 라벨(좌) + 값(우) 구조의 테이블 행

## 6. 디자인 토큰

- Modal max-width: `440px`
- Background: `--bg-elev-1`, `r-xl`
- Backdrop: `rgba(10, 14, 26, 0.7)` dim + `backdrop-filter: blur(4px)`
- Header/Body 구분: `border-bottom: 1px --border`
- Cost callout: `--bg`, `--border-hi`, `r-md`

## 7. 타이포그래피

- Status badge: `mono-meta` `--success`
- Title: `heading` (18px 600) `--text`
- Subtitle: `body-sm` `--text-2`
- Details label: `body-sm` `--text-2`
- Details value: `mono-meta` (12px 500) `--text`
- Cost label: `ui-label` `--text-2`
- Cost value: `subheading` (14px 600) `--text`
- Footnote: `mono-meta` `--text-3`

## 8. 아이콘

- Check (badge): `Check` (14)
- Close: `X` (16)
- Connect arrow (between avatars): `Link` (16) `--brand`
- Details aisle: `MessageSquare`, `Heart`, `Sparkles`, `Zap` (16, `--text-3`)
- Ticket: `Gem` (16) `--warning` (gold 컬러)
- Primary CTA: `ArrowRight` (16)

## 9. 인터랙션

- **모달 진입**: backdrop fade-in 200ms, 모달 slide-up + fade-in 300ms
- **X 버튼**: 모달 닫기 → "나중에" 선택과 동일
- **"나중에"**: 모달 닫기, 세션 종료 페이지로 이동 (연결 대기 리스트에 저장됨)
- **"본인 인증 후 연결"**:
  1. 인증 여부 체크
  2. 미인증: `/verify-identity` 로 리다이렉트 (인증 후 복귀)
  3. 인증됨: 매칭 요청 API 호출 → 상대 승낙 대기 페이지로 전환
- **Backdrop 클릭**: 닫기 (나중에와 동일)
- **ESC 키**: 닫기

## 10. 반응형

- Mobile: Modal이 화면 전체 (full-screen), border-radius 상단만, 하단 고정 버튼
- Detail rows: label / value 가로 배치 유지 (한 줄)

## 11. 접근성

- `role="dialog"` `aria-modal="true"`
- `aria-labelledby` → 제목 id 연결
- 포커스 트랩: 모달 안에서만 탭 순환
- 모달 열림 시: 첫 포커스는 "본인 인증 후 연결" 버튼
- 모달 닫힘 시: 이전 포커스로 복귀

## 12. 카피라이팅

### 헤더

- Status badge: "호감도 임계값 돌파"
- 제목: "본캐 연결 가능"
- 서브: "두 아바타의 최종 호감도 {n} · 매칭 성공 확률 상위 {percent}%"

### Details

| 라벨 | 값 형식 | 아이콘 |
|------|---------|--------|
| 진행 턴 | {current} / {total} | MessageSquare |
| 최종 호감도 | {n} (--success) | Heart |
| 공통 관심사 | {a} · {b} · ... | Sparkles |
| 사용한 훈수 | {n}회 · -{gems} 💎 | Zap |

### Cost

- 라벨: "연결 비용"
- Sublabel: "상대 수락 시에만 차감"
- 값: "매칭 티켓 1"

### Actions

- Secondary: "나중에"
- Primary: "본인 인증 후 연결"
- Footnote: "본인 인증(휴대폰)이 필요합니다 · 실제 채팅은 양측 모두 수락 후 개설"

### 이미 본인 인증된 경우

- Primary 버튼: "연결 요청 보내기" (본인 인증 언급 제거)
- Footnote: "실제 채팅은 양측 모두 수락 후 개설됩니다"

## 13. 상태 머신

```
opened → user-action:
  - "나중에": closed → session-end screen
  - "연결" (unverified): verify-identity → back to modal (resumed)
  - "연결" (verified): api-call → waiting-for-other → 
      → other-accepts → real-chat
      → other-declines → close + notification
      → timeout (24h) → auto-close + notification
```

## 14. API

- `GET /api/user/verification-status` (인증 여부 확인)
- `POST /api/matching/propose` (매칭 제안 생성, body: { sessionId, partnerId })

### 스키마

```ts
interface MatchingProposalRequest {
  sessionId: string;
  partnerId: string;
}

interface MatchingProposalResponse {
  proposalId: string;
  expiresAt: string;  // 24h
  status: 'pending';
}
```

## 15. 엣지 케이스

- **상대가 이미 차단/탈퇴**: 모달 열 때 체크. 해당 시 "연결할 수 없습니다" 에러 모달로 대체.
- **매칭 티켓 부족**: Primary 버튼 disable + "매칭 티켓 구매" 링크.
- **이미 진행 중인 매칭 제안 존재**: 모달 대신 진행중 매칭 페이지로 리다이렉트.
- **세션 만료 후 접근** (24h+ 지난 세션): 모달 열리지 않고 "만료된 세션" 안내.

## 16. 참조

- `avating-design-v2.html` Section 06
- 관련 DSD: `simulation-view.md`, `identity-verify.md` (미작성)

---

## Design Rationale

### 결정 1: **사실 기반 요약** (Hearts 폭죽 없이)

- **이유**: 감정 과잉은 "AI가 만든 티"의 핵심 원인. 수치 기반 요약이 신뢰감을 줌.
- **대안**: 하트 애니메이션 + 컨페티 → 기각 (Anti-AI Aesthetics 위반)

### 결정 2: **매칭 티켓 차감 시점을 상대 수락 후**로 명시

- **이유**: 사용자가 일방적으로 결제하고 거절당하면 불만 크다. 조건부 차감으로 안심.
- **대안**: 제안 시 즉시 차감 → 기각 (심리적 저항)

### 결정 3: 본인 인증을 **매칭 시점에만** 요구

- **이유**: 관전만 원하는 사용자에게 가입 시 본인 인증은 과한 부담.
- **대안**: 가입 시 즉시 인증 → 기각 (signup DSD와 일관)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
