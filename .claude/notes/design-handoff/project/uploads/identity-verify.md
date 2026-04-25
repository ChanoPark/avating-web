---
screen: identity-verify
version: 1.0.0
status: approved
author: design-agent
pattern: C
---

# DSD · 본인 인증

## 1. 개요

**목적**: 본캐 연결 직전, 실제 사용자임을 확인하기 위해 휴대폰 본인인증 (PASS/NICE/KCB 등) 수행.
**사용자**: 매칭 confirm 모달에서 "본인 인증 후 연결" 클릭한 사용자.
**성공 지표**: 인증 시작 → 완료율 (목표 85%+), 평균 소요 시간.

## 2. User Journey

```
Matching Confirm → [Identity Verify] → verification provider (external) → callback → Matching Proposal Send
```

## 3. 패턴

`C (Wizard)` — 단일 스텝이지만 wizard shell 유지 (진행감).

## 4. 레이아웃

```
┌──────────────────────────────────────┐
│                                      │
│ BACK TO MATCHING                     │
│                                      │
│ 본인 인증                              │
│ 실제 연결 전 1회 필요합니다.           │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  [Shield] 본인인증이 필요한 이유  │ │
│ │                                  │ │
│ │  • 실제 사용자 보호              │ │
│ │  • 허위 계정 필터링              │ │
│ │  • 법적 요구사항 (전자상거래법)   │ │
│ │                                  │ │
│ │  수집 정보: 이름, 생년월일, 성별 │ │
│ │  저장 기간: 인증 완료 후 즉시 폐기│ │
│ └──────────────────────────────────┘ │
│                                      │
│ 인증 방법                            │
│ ○ 휴대폰 본인인증 (PASS)            │
│ ○ 카드 본인인증                     │
│                                      │
│ [이용약관] [개인정보 처리방침]       │
│ ☑ 위 약관에 동의합니다               │
│                                      │
│             [인증 시작하기 →]         │
│                                      │
│ 약 2-3분 소요 · 중단 시 언제든 재시도│
└──────────────────────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button, Icon, Tag (선택지 radio), Checkbox (from signup DSD)

**신규**:
- `VerificationMethodOption`: 라디오 선택지 + 아이콘 + 설명. survey-option의 variant로 처리 가능.
- `InfoCard`: 정보 제공 카드 (아이콘 + 리스트). 다른 설명 화면에서도 재사용 가능.

## 6. 디자인 토큰

- Info card 배경: `--brand-soft`, border `--brand-border`
- 방법 선택 카드: `--bg-elev-2`, 선택 시 `--brand-soft` + `--brand-border`
- 가로 구분선: `border-b --border`

## 7. 타이포그래피

- "BACK TO MATCHING": `mono-micro` uppercase `--text-3` (링크)
- 제목: `title`
- 서브: `body` `--text-2`
- Info card 제목: `ui-label` (500)
- Info card 리스트: `body-sm` `--text-2`
- 수집 정보/저장 기간: `mono-meta` `--text-3`
- 약관 링크: `body-sm` underline

## 8. 아이콘

| 위치 | Lucide |
|------|--------|
| Back link | `ArrowLeft` |
| Info card 제목 | `Shield` (`--brand`) |
| 인증 방법 아이콘 | 휴대폰 → 핸드폰 아이콘 / 카드 → CreditCard |
| CTA trailing | `ArrowRight` |

## 9. 인터랙션

- **인증 방법 선택**: 라디오 (단일 선택)
- **약관 체크**: 미체크 시 CTA 비활성
- **"인증 시작"**: 외부 인증사 페이지로 리다이렉트 (window 이동, 팝업 X)
- **돌아오기** (인증 성공/실패 callback):
  - 성공: 매칭 confirm 모달로 자동 복귀 + 즉시 매칭 제안 API 호출
  - 실패: 이 화면에 "인증 실패: {사유}" 배너 + 재시도 안내
  - 취소: 이 화면에 돌아와 아무 상태 변경 없음

## 10. 반응형

- Mobile: 인증 방법 카드 세로 스택
- Info card padding 축소

## 11. 접근성

- 라디오 그룹: `role="radiogroup"` `aria-labelledby`
- Info card: `role="region"` `aria-labelledby`
- 약관 링크는 새 탭 열림 (`target="_blank"` + `aria-label="새 탭에서 열림"`)
- 진행 상태 알림: 외부 이동 직전 `aria-live`로 "외부 인증 페이지로 이동합니다"

## 12. 카피라이팅

| 위치 | 텍스트 |
|------|--------|
| Back link | ← 매칭으로 돌아가기 |
| 제목 | 본인 인증 |
| 서브 | 실제 연결 전 1회 필요합니다 |
| Info card 제목 | 본인인증이 필요한 이유 |
| Info 목록 | 실제 사용자 보호 · 허위 계정 필터링 · 법적 요구사항 (전자상거래법) |
| 수집 정보 | 수집 정보: 이름, 생년월일, 성별 |
| 저장 기간 | 저장 기간: 인증 완료 후 즉시 폐기 |
| 방법 섹션 | 인증 방법 |
| 방법 1 | 휴대폰 본인인증 (PASS) |
| 방법 1 설명 | 통신사 3사 지원 · 가장 빠름 |
| 방법 2 | 카드 본인인증 |
| 방법 2 설명 | 본인 명의 신용/체크카드 필요 |
| 약관 체크 | 위 약관에 동의합니다 · [이용약관] [개인정보 처리방침] |
| CTA | 인증 시작하기 |
| 소요 시간 | 약 2-3분 소요 · 중단 시 언제든 재시도 |

### 에러 메시지

| 상황 | 메시지 |
|------|--------|
| 인증 실패 (일반) | 본인 인증에 실패했습니다. 입력 정보를 확인하고 다시 시도해주세요. |
| 인증 중단 | 인증이 중단되었습니다. 다시 시도하시겠어요? |
| 이미 인증된 계정 | 이미 본인 인증이 완료되었습니다. 매칭으로 돌아갑니다. (자동 redirect 3초) |
| 인증사 서버 오류 | 인증 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요. |
| 만 19세 미만 (차단) | 본 서비스는 만 19세 이상만 이용할 수 있습니다. |

## 13. 상태 머신

```
idle → method-selected (require terms) → ready
ready → (CTA click) → redirect-to-provider
redirect-to-provider → (callback success) → matching-proposal-api → redirect to proposal-pending
                    → (callback fail) → error-display → idle
                    → (callback timeout) → error-display (provider timeout) → idle
                    → (callback cancel) → idle
```

## 14. API

- `GET /api/auth/verification-status` — 이미 인증됐는지 확인 (진입 시)
- `POST /api/auth/verification/init` — 인증사 세션 시작, 리다이렉트 URL 반환
- `POST /api/auth/verification/callback` — 인증사에서 돌아오면 콜백 처리 (white-list된 state 토큰 검증)

### 스키마

```ts
interface VerificationInitRequest {
  method: 'mobile-pass' | 'card';
  returnUrl: string;   // /matching-confirm/{proposalContext}
}

interface VerificationInitResponse {
  redirectUrl: string;
  sessionToken: string;
}

interface VerificationCallbackResult {
  success: boolean;
  userId?: string;
  failureReason?: 'mismatch' | 'under-age' | 'timeout' | 'cancelled' | 'provider-error';
}
```

## 15. 엣지 케이스

- **이미 인증된 사용자 접근**: "이미 인증 완료" 메시지 + 3초 후 자동 매칭으로 복귀
- **외부 인증사 장애**: 여러 사유 코드 구분하여 메시지 표시, retry 버튼 제공
- **만 19세 미만**: 가입 자체가 막혀야 하므로 이 화면에 도달할 수 없어야 함. 도달 시 긴급 차단 (계정 정지)
- **성별 불일치 (기존 프로필과)**: 경고 후 프로필 업데이트 유도 (단, 이 화면에서는 인증은 계속 진행)
- **인증 세션 만료 (10분)**: 자동 재생성 제안

## 16. 참조

- 관련 DSD: `matching-confirm.md` (진입점), `signup.md` (인증 유예 정책 결정 참조)

---

## Design Rationale

### 결정: 인증을 **가입 시점이 아닌 매칭 시점**에

- **이유**: signup.md의 근거와 동일. 관전만 원하는 사용자의 이탈 방지.
- **대안**: 가입 직후 강제 → 기각

### 결정: 외부 인증사 페이지를 **팝업이 아닌 리다이렉트**

- **이유**: 팝업은 차단당할 가능성, 모바일에서 UX 불안정. 리다이렉트 + 콜백 URL이 표준적.
- **대안**: iframe 임베드 → 기각 (인증사 정책상 허용 X), 팝업 → 기각 (차단 리스크)

### 결정: "수집 정보/저장 기간"을 **명시적으로 노출**

- **이유**: 다크 패턴 회피. 사용자 신뢰 구축. 법적으로도 수집 항목 고지 의무.
- **대안**: 약관 링크에만 기재 → 기각 (규제 리스크 + 신뢰 손실)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
