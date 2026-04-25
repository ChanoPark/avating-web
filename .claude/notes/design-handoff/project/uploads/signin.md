---
screen: signin
version: 1.0.0
status: approved
author: design-agent
created: 2026-04-18
updated: 2026-04-18
pattern: A
---

# DSD · 로그인 (Signin)

## 1. 개요

**목적**: 기존 사용자가 빠르게 재접속.
**성공 지표**: 로그인 소요 시간, OAuth 성공률.

## 2. User Journey 위치

```
<랜딩/signin URL> → [로그인] → 대시보드
```

## 3. 레이아웃 패턴

- **패턴**: `A (Auth Split)`의 **단일 패널 변형**
- **선택 이유**: 회원가입과 동일 레이아웃을 유지하되, 브랜드 비주얼을 생략하고 폼만 중앙 정렬 (재방문자는 설득이 불필요).

## 4. 레이아웃 상세

```
        ┌──────────────────────┐
        │  돌아오신 걸 환영합니다 │
        │  계정이 없다? [가입]  │
        │                      │
        │  [Google]  [Apple]   │
        │                      │
        │  ── OR ──            │
        │                      │
        │  [이메일]             │
        │  [비밀번호 | 찾기]    │
        │                      │
        │  [로그인 →]           │
        └──────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button (primary lg, oauth), Input, Icon, Checkbox (필요 시 "로그인 유지").

## 6. 디자인 토큰

- Frame max-width: `520px`, 중앙 정렬
- 배경: `--bg`
- Form 영역: `--bg-elev-1`, `r-xl`, `shadow-2`

## 7. 타이포그래피

- 제목: `title` (24px)
- 서브: `body-sm` `--text-3`

## 8. 아이콘

- OAuth: Google/Apple 공식
- 제출: `ArrowRight`

## 9. 인터랙션

- Enter → 다음 필드 → 제출
- 로그인 실패 5회 → reCAPTCHA 노출
- "비밀번호 찾기" 링크 → `/forgot-password`

## 10. 반응형

- 모바일: padding 축소, 동일 레이아웃

## 11. 접근성

- 이메일 필드 자동 포커스
- 에러 메시지 `role="alert"`

## 12. 카피라이팅

| 위치 | 텍스트 |
|------|--------|
| 제목 | 돌아오신 걸 환영합니다 |
| 서브 | 계정이 없으신가요? **가입하기** |
| 이메일 라벨 | 이메일 |
| 비밀번호 라벨 | 비밀번호 |
| 비밀번호 찾기 링크 | 비밀번호 찾기 |
| Submit | 로그인 |

### 에러 메시지

- 계정 없음: "이메일 또는 비밀번호가 올바르지 않습니다" (보안상 어느 쪽인지 알리지 않음)
- 잠김: "계정이 임시 잠겨있습니다. 5분 후 다시 시도해주세요"

## 13. 상태 머신

```
idle → submitting → success → (redirect)
                 → error → idle
                 → locked → wait 5min
```

## 14. API

- `POST /api/auth/signin`
- `GET /api/auth/oauth/{provider}`

## 15. 엣지 케이스

- 로그인 성공 시 `redirect` 쿼리 파라미터가 있으면 해당 경로로, 없으면 `/dashboard`
- refresh token 만료 시 재로그인 요청

## 16. 참조

- `avating-design-v2.html` Section 02
- 관련 DSD: `signup.md`

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
