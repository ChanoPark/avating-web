---
screen: onboarding-welcome
version: 1.0.0
status: approved
author: design-agent
pattern: C (단일 스텝, 장식 최소)
---

# DSD · 온보딩 · Welcome (Step 1)

## 1. 개요

**목적**: 회원가입 직후 첫 화면. 온보딩 전체 플로우를 예고하고 "시작하기" 한 번의 선택을 유도.
**사용자**: 가입을 막 완료한 신규 회원.
**성공 지표**: "시작하기" 클릭율 (이탈률 최소화 목표).

## 2. User Journey

```
Signup → [Welcome] → Survey (Step 2) → Connect (Step 3) → Complete (Step 4)
```

- 진입: Signup 성공 응답 후 자동 라우팅 (`/onboarding/welcome`)
- 이탈 불가 — "나중에" 옵션 없음 (온보딩 완료 전 내부 진입 차단)

## 3. 레이아웃 패턴

- **패턴**: `C (Wizard)`의 Step 1 — 진행바만 있고 콘텐츠는 중앙 정렬

## 4. 레이아웃 상세

```
┌──────────────────────────────────────┐
│ [━━━━─────────────────────────────]   │  ← Progress: Step 1/4 active
│                                      │
│                                      │
│ STEP 1 / 4 · 시작                     │
│                                      │
│ 당신의 아바타를 만듭니다.              │
│                                      │
│ 다음 세 단계로 진행됩니다.             │
│                                      │
│   [01]  성향 설문 (약 2분)            │
│        6가지 질문에 답합니다          │
│                                      │
│   [02]  GPT 연결 (약 10분)            │
│        Custom GPT와 대화합니다        │
│                                      │
│   [03]  아바타 확인                  │
│        결과를 검토하고 수정합니다     │
│                                      │
│                                      │
│                    [시작하기 →]       │
└──────────────────────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button (primary lg), Icon, Kbd

**신규 불필요**: ProgressSteps는 onboarding-survey DSD에서 이미 정의.

## 6. 디자인 토큰

- 배경: `--bg`
- Step 카드: `--bg-elev-1`, `r-md`, border `--border`
- 순번 박스: `--bg-elev-2`, 44×44px, `r-sm`, font-mono
- 간격: 각 Step 카드 사이 `space-3` (12px)

## 7. 타이포그래피

| 요소 | 스타일 | 색상 |
|------|--------|------|
| Step label (상단) | `mono-micro` uppercase | `--text-3` |
| 메인 제목 | `title` (24px) | `--text` |
| 서브 설명 | `body` | `--text-2` |
| Step 번호 (01/02/03) | `font-mono` 18px 500 | `--text-2` |
| Step 제목 | `subheading` | `--text` |
| Step 설명 | `body-sm` | `--text-3` |

## 8. 아이콘

- CTA trailing: `ArrowRight` (16)
- (Step 카드에는 아이콘 불필요 — 숫자로 충분)

## 9. 인터랙션

- **"시작하기" 클릭**: `/onboarding/survey`로 라우팅
- **Enter**: 즉시 CTA 실행
- 다른 액션 없음 (뒤로가기는 브라우저 기본 동작만)

## 10. 반응형

- Mobile: Step 카드 간격 `space-4` (여백 증가), 폰트 1단계 축소
- 기본 레이아웃 유지

## 11. 접근성

- Progress: `role="progressbar"` `aria-valuenow={1}` `aria-valuemax={4}`
- CTA에 자동 포커스 (페이지 진입 시)
- Step 리스트는 `<ol>` 시맨틱 사용

## 12. 카피라이팅

| 위치 | 텍스트 |
|------|--------|
| Step label | STEP 1 / 4 · 시작 |
| 제목 | 당신의 아바타를 만듭니다 |
| 서브 | 다음 세 단계로 진행됩니다 |
| Step 01 제목 | 성향 설문 (약 2분) |
| Step 01 설명 | 6가지 질문에 답합니다 |
| Step 02 제목 | GPT 연결 (약 10분) |
| Step 02 설명 | Custom GPT와 대화합니다 |
| Step 03 제목 | 아바타 확인 |
| Step 03 설명 | 결과를 검토하고 수정합니다 |
| CTA | 시작하기 |

## 13. 상태 머신

```
arrived → (CTA click) → navigate to survey
```

## 14. API

- 없음 (정적 페이지)
- 단, 진입 시 `GET /api/onboarding/progress`로 이미 완료된 단계가 있는지 확인, 있으면 해당 단계로 리다이렉트

## 15. 엣지 케이스

- **새로고침 후**: 진행 상태 API로 현재 단계 복원
- **이미 완료한 사용자의 직접 URL 접근**: `/dashboard`로 리다이렉트
- **뒤로가기 (브라우저)**: Signup으로 돌아감. 단, 이미 가입 완료 상태이므로 Signup이 자동 리다이렉트로 여기로 복귀 — 무한 루프 방지를 위해 History 조작 필요

## 16. 참조

- `avating-design-v2.html` Section 03 (Onboarding 구조)
- 관련 DSD: `onboarding-survey.md`, `onboarding-connect.md`, `onboarding-complete.md`

---

## Design Rationale

### 결정: "나중에" 옵션 제거

- **이유**: 아바타가 없으면 핵심 기능(파견) 사용 불가. 온보딩을 건너뛰면 서비스 가치 자체가 작동하지 않음. 선택지 제거가 사용자에게도 더 친절함.
- **대안**: "나중에 할게요" 링크 → 기각 (기능 막힌 상태로 서비스 진입 시 더 큰 혼란)

### 결정: 3단계만 언급 (실제는 4단계)

- **이유**: 사용자가 인지하는 흐름은 "설문 → GPT → 확인". "시작" 단계는 지금 이 화면 자체이므로 설명 불필요.
- **대안**: 4단계 모두 나열 → 기각 (첫 단계에서 자기 자신을 리스트에 포함하면 메타스러움)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
