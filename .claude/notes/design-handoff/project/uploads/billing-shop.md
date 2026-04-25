---
screen: billing-shop
version: 1.0.0
status: approved
author: design-agent
pattern: B + G
---

# DSD · 상점 · 다이아/매칭 티켓 구매

## 1. 개요

**목적**: 다이아 및 매칭 티켓 패키지를 구매하고, 최근 거래 내역을 확인.
**성공 지표**: ARPPU, 패키지별 구매 전환율, 첫 구매 전환율.

## 2. User Journey

```
Sidebar → [Shop] → select package → checkout modal → payment → receipt
Simulation (다이아 부족) → [Shop] (via link) → quick recharge
```

## 3. 패턴

`B (App Shell)` + `G (Data List)` (거래 내역).

## 4. 레이아웃

```
┌────────┬──────────────────────────────────────┐
│Sidebar │ 홈 > 상점                  [💎 1,240]│
│        ├──────────────────────────────────────┤
│        │                                      │
│        │ [다이아] [매칭 티켓] [구독]           │  ← Tabs
│        │ ────────────                         │
│        │                                      │
│        │ (탭: 다이아)                          │
│        │                                      │
│        │ ┌──────┬──────┬──────┬──────┐       │
│        │ │ 💎100 │ 💎500 │💎1500 │💎5000 │       │
│        │ │      │ +25  │ +150 │ +750 │       │
│        │ │ ₩1k  │₩5k   │₩15k  │₩50k  │       │
│        │ │[구매]│[구매]│★인기│[구매]│       │
│        │ └──────┴──────┴──────┴──────┘       │
│        │                                      │
│        │ 사용 안내                            │
│        │ • 훈수 1회 · 3~20 다이아              │
│        │ • 속마음 해제 · 3 다이아              │
│        │ • 대기 단축 · 15 다이아               │
│        │                                      │
│        │ 최근 거래 내역                       │
│        │ ┌──────────────────────────────────┐ │
│        │ │ 날짜   | 내용         | 금액     │ │
│        │ ├──────────────────────────────────┤ │
│        │ │ 오전   | 다이아 +500  | -₩5,000  │ │
│        │ │ 어제   | 훈수 사용    | -21 💎   │ │
│        │ │ 2일전  | 매칭 티켓 1  | -₩15,000 │ │
│        │ └──────────────────────────────────┘ │
└────────┴──────────────────────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button, Tag, Icon, Kbd

**신규**:
- `PackageCard`: 패키지 카드 (다이아 수 + 보너스 + 가격 + CTA + 선택적 "인기" 뱃지).
- `TransactionRow`: 거래 내역 행 (날짜/내용/금액).
- `Tabs`: my-avatar.md와 동일.

## 6. 디자인 토큰

- Package card: `--bg-elev-1`, `r-md`, border `--border`, padding `space-5`
- "인기" 표시 카드: border `--brand-border`, 상단 태그 `tag-brand`
- 거래 내역 테이블: `--bg-elev-2`, `r-md`

## 7. 타이포그래피

| 요소 | 스타일 |
|------|--------|
| 패키지 다이아 수량 | `title` (24px, mono) |
| 보너스 표시 | `mono-meta` `--success` |
| 가격 | `heading` (16px, mono) |
| "인기" 뱃지 | `tag-brand` |
| 사용 안내 | `body` · 항목은 `mono-meta` 수치 |
| 거래 내역 금액 | `font-mono` |

## 8. 아이콘

| 위치 | Lucide |
|------|--------|
| 다이아 | `Gem` (`--brand`) |
| 매칭 티켓 | `Gem` with `--warning` 색상 |
| 구독 | `Shield` or `Sparkles` |
| 구매 CTA trailing | `ArrowRight` |
| 거래 내역 타입 | 거래 종류별 (+ → TrendingUp / - → TrendingDown) |

## 9. 인터랙션

- **패키지 카드 클릭**: 결제 모달 오픈 (카드/페이 선택 → 결제 → 성공/실패)
- **탭 전환**: URL query 반영 (`?tab=gems`, `?tab=tickets`, `?tab=subscription`)
- **거래 내역 행 클릭**: 해당 거래 상세 모달 (영수증 다운로드 옵션)
- **Quick recharge from elsewhere**: 다른 화면에서 "다이아 부족" 링크로 진입 시 쿼리 파라미터 `?recharge=minimum-for-intervention` 받아 추천 패키지 강조

## 10. 반응형

- Mobile: 패키지 카드 4개 → 2×2 grid
- 거래 내역: 3열 → 2열 (날짜·내용 결합) 또는 카드 형태

## 11. 접근성

- 탭: `role="tablist"`, 키보드 네비게이션
- 결제 모달: focus trap, ESC 닫기
- 가격 표시: `aria-label="5,000원 · 다이아 500개 + 보너스 25개"` (스크린리더용 풀 설명)

## 12. 카피라이팅

### 탭

- 다이아 · 매칭 티켓 · 구독

### 다이아 탭

| 위치 | 텍스트 |
|------|--------|
| 패키지 카드 제목 | {수량} 다이아 |
| 보너스 | +{n} 보너스 |
| 인기 뱃지 | 인기 |
| CTA | 구매 |
| 사용 안내 제목 | 사용 안내 |
| 사용 예시 | 훈수 1회 · 3~20 다이아 / 속마음 해제 · 3 다이아 / 대기 단축 · 15 다이아 |

### 매칭 티켓 탭

| 위치 | 텍스트 |
|------|--------|
| 패키지 | 1장 / 3장 / 10장 |
| 가격 | ₩15,000 / ₩40,000 / ₩120,000 |
| 설명 | 본캐 연결 시 소모. 상대 수락 시에만 차감. |

### 구독 탭

| 위치 | 텍스트 |
|------|--------|
| 플랜 | Basic / Plus |
| Basic (무료) | 기본 기능 · 월 3회 파견 제한 |
| Plus (월 9,900원) | 무제한 파견 · 매월 500 다이아 지급 · 프리미엄 필터 · 인증 배지 |

### 거래 내역

| 위치 | 텍스트 |
|------|--------|
| 제목 | 최근 거래 내역 |
| 컬럼 | 날짜 · 내용 · 금액 |
| 더 보기 | 전체 내역 보기 |
| 빈 상태 | 거래 내역이 없습니다 |

### 결제 모달

- 제목: 결제
- 선택 옵션: 카드 · 간편결제 (토스/카카오/네이버)
- 확인 버튼: {금액} 결제하기
- 취소: 취소
- 로딩: 결제 진행 중... (이 창을 닫지 마세요)
- 성공 토스트: 결제가 완료되었습니다 · {수량} 다이아가 지급되었습니다
- 실패: 결제에 실패했습니다. 다시 시도해주세요. (자세한 사유: {reason})

## 13. 상태 머신

```
idle → (package click) → checkout-modal
checkout-modal → (confirm) → processing → success/fail
success → close modal + update balance + add transaction row
fail → retry | cancel
```

## 14. API

- `GET /api/shop/packages?type=gems|tickets|subscription` — 패키지 목록
- `POST /api/billing/checkout` — 결제 시작 (body: { packageId, paymentMethod })
- `GET /api/me/transactions?limit=20` — 거래 내역

### 스키마

```ts
interface Package {
  id: string;
  type: 'gems' | 'tickets' | 'subscription';
  name: string;
  quantity: number;
  bonusQuantity?: number;
  priceKRW: number;
  isPopular?: boolean;
  description?: string;
}

interface Transaction {
  id: string;
  timestamp: string;
  type: 'purchase-gems' | 'purchase-tickets' | 'subscription' | 'intervention' | 'blind-reveal' | 'match-ticket-use';
  description: string;
  amount: {
    currency: 'KRW' | 'GEMS' | 'TICKETS';
    value: number;      // 음수 = 지출, 양수 = 획득
  };
}
```

## 15. 엣지 케이스

- **결제 도중 창 닫힘**: 백엔드 webhook으로 상태 확인, 재접속 시 pending 거래 안내
- **중복 결제 시도**: idempotency key로 방지
- **환불**: 별도 화면 (`/settings/refund`)으로 이동 안내 (이 화면에서는 직접 처리 X)
- **지역 제한**: 해외 IP의 경우 일부 결제 수단 비활성 + 안내 메시지
- **미성년자 결제 방지**: 본인인증 완료 여부 체크, 미완료 시 인증 유도

## 16. 참조

- 관련 DSD: `matching-confirm.md` (매칭 티켓 사용 지점), `simulation-view.md` (다이아 사용 지점)

---

## Design Rationale

### 결정: 한 화면에 다이아/티켓/구독 **모두**

- **이유**: 사용자의 구매 의도는 "돈 쓰기"로 통합적. 별도 페이지 분리 시 탐색 비용 증가.
- **대안**: 각각 별도 페이지 → 기각 (사용자 혼란)

### 결정: 500 다이아 패키지를 "인기"로

- **이유**: 첫 구매 사용자가 적정 금액을 고르지 못하면 이탈. 실제 사용 패턴(중간 가격대 선호)에 맞춘 기본값 유도.
- **대안**: 중립적 표시 / 최대 패키지 강조 → 기각 (전자는 결정 지연, 후자는 부담)

### 결정: 거래 내역을 상점 화면에 **통합**

- **이유**: 구매 직후 영수증 확인 흐름이 자연스러움. 별도 페이지 분리하면 잊힘.
- **대안**: `/settings/transactions` 분리 → 기각 (두 번째 구매 결정에도 과거 내역 참조 가치)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
