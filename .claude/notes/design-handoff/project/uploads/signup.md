---
screen: signup
version: 1.0.0
status: approved
author: design-agent
created: 2026-04-18
updated: 2026-04-18
pattern: A
---

# DSD · 회원가입 (Signup)

## 1. 개요

**목적**: 신규 사용자가 이메일/OAuth로 계정을 만들고 온보딩에 진입하도록 안내한다.
**주요 사용자**: 서비스에 처음 방문한 비회원 (19세 이상).
**성공 지표**: 가입 완료율, OAuth vs 이메일 비율, 약관 동의 이탈률.

## 2. User Journey 내 위치

```
<랜딩 페이지 또는 직접 URL> → [회원가입] → 온보딩 Step 1 (설문)
```

- **진입 경로**: 랜딩 CTA, 로그인 페이지의 "가입하기" 링크, `/signup` 직접 URL
- **이탈 경로**:
  - 성공 → 온보딩 Step 1
  - 취소/뒤로 → 랜딩
  - 로그인 전환 → `/signin`

## 3. 레이아웃 패턴

- **패턴**: `A (Auth Split)`
- **선택 이유**: 브랜드 가치 제안을 좌측에 보여주면서 우측에서 실제 가입을 처리하는 전통적이고 신뢰감 있는 구조. Linear/Vercel의 인증 페이지가 이 패턴을 채택하고 있어 톤과 일치.

## 4. 레이아웃 상세

```
┌──────────────────────┬──────────────────────┐
│ [Brand] Avating      │                      │
│                      │  계정 만들기          │
│ [Grid background]    │  이미 계정? [로그인]  │
│                      │                      │
│                      │  [Google 버튼]       │
│ Headline             │  [Apple 버튼]        │
│ Sub description      │                      │
│                      │  ── OR ──            │
│ ✓ Feature 1          │                      │
│ ✓ Feature 2          │  [이메일]             │
│ ✓ Feature 3          │  [닉네임]             │
│                      │  [비밀번호]            │
│                      │  [강도 미터]          │
│                      │                      │
│                      │  ☑ 약관 동의         │
│                      │  ☐ 알림 수신         │
│                      │                      │
│                      │  [계정 만들기 →]      │
│                      │                      │
│                      │  본인 인증은 매칭 시... │
└──────────────────────┴──────────────────────┘
```

### 영역별 상세

- **좌측 (Brand Visual)**:
  - Brand Mark + "Avating" 로고 (상단)
  - Headline: "연애의 긴장은 아바타가, 결정은 당신이."
  - Sub description: 2-3줄
  - Feature list 3개 (체크 아이콘 + 짧은 설명)
  - 배경: 반투명 그리드 (`48×48px`), radial mask로 우측 페이드

- **우측 (Form Panel)**:
  - 제목 + 로그인 링크
  - OAuth 버튼 2개 (Google, Apple)
  - OR divider
  - 이메일, 닉네임, 비밀번호 입력
  - 비밀번호 강도 미터 + 힌트
  - 약관 동의 체크박스 2개 (필수/선택)
  - Primary 버튼 (full width)
  - Footnote: 본인 인증 시점 안내

## 5. 컴포넌트 인벤토리

### 사용할 기존 컴포넌트 (재사용)

| 컴포넌트 | Variant | 용도 |
|----------|---------|------|
| Button | primary, size=lg | "계정 만들기" CTA |
| Button | ghost, size=icon | 비밀번호 표시 토글 |
| Input | default | 이메일, 닉네임, 비밀번호 |
| Icon | 16 | 모든 아이콘 표시 |

### 신규 필요 컴포넌트

| 컴포넌트 | 이유 | 승인 필요 여부 |
|----------|------|---------------|
| `OAuthButton` | Google/Apple 로그인 버튼. 브랜드 로고 + 표준 레이아웃. 일반 Button 컴포넌트로 만들기보다 명시적 분리가 유지보수에 유리. | 승인 필요 |
| `PasswordStrengthMeter` | 4단계 막대 + 힌트 텍스트. 가입 외 다른 화면(비밀번호 변경)에서도 재사용. | 승인 필요 |
| `Checkbox` | 공용 체크박스. 다른 폼에서도 사용될 것으로 예상. | 승인 필요 |

## 6. 디자인 토큰 적용

- **페이지 배경**: `--bg` (Auth Split 좌측), `--bg-elev-1` (우측 폼 패널)
- **구분선**: 좌우 사이 `border-right: 1px var(--border)`
- **주요 텍스트**: `--text` (헤드라인, 라벨)
- **보조 텍스트**: `--text-2` (설명, 힌트), `--text-3` (footnote)
- **포인트**: `--brand` (Primary 버튼, "로그인" 링크, focus)
- **패딩**: 좌측 `40px`, 우측 `48px 40px`
- **Radius**: Input/Button `r-sm` (6px)

## 7. 타이포그래피 적용

| 요소 | 스타일 | 색상 |
|------|--------|------|
| 브랜드 로고 텍스트 | `heading` (16px, Inter Tight 600) | `--text` |
| 좌측 Headline | `display` (32px) | `--text` |
| 좌측 Sub | `body` | `--text-2` |
| Feature 제목 | `ui-label` | `--text` |
| Feature 설명 | `body-sm` | `--text-2` |
| 우측 "계정 만들기" 제목 | `title` (24px) | `--text` |
| "이미 계정이 있으신가요?" | `body-sm` | `--text-3` |
| Input label | `ui-label` | `--text-2` |
| Helper text | `mono-meta` | `--text-3` |
| Footnote | `body-sm` | `--text-3` |

## 8. 아이콘

| 위치 | 아이콘 (Lucide) | 크기 | 색상 |
|------|----------------|------|------|
| Feature list | `Shield`, `Eye`, `Sparkles` | 16 | `--brand` |
| Google OAuth | Google 공식 로고 | 16 | 브랜드 컬러 |
| Apple OAuth | Apple 로고 | 16 | `--text` |
| 비밀번호 토글 | `Eye` / `EyeOff` | 14 | `--text-3` |
| 강도 미터 hint | `Check` (ok일 때) | 12 | `--success` |
| Checkbox (checked) | `Check` | 11 | `#fff` |
| 제출 버튼 | `ArrowRight` | 16 | currentColor |

## 9. 인터랙션

### 사용자 액션 → 시스템 반응

| 액션 | 반응 | 피드백 |
|------|------|--------|
| Google 버튼 클릭 | OAuth 팝업 또는 리다이렉트 | 버튼 disable + 스피너 |
| 이메일 입력 | 실시간 validation | blur 시 에러 메시지 (형식 오류 시) |
| 닉네임 입력 | 길이 validation | 2자 미만/12자 초과 시 에러 |
| 비밀번호 입력 | 실시간 강도 계산 | 막대 + 힌트 텍스트 즉시 업데이트 |
| 비밀번호 토글 버튼 | `type=password` ↔ `type=text` | 아이콘 변경 |
| 필수 약관 미체크 + 제출 | 에러 표시 | 체크박스 옆 에러 메시지 + 필드로 스크롤 |
| "계정 만들기" 클릭 (정상) | API 호출 | 버튼 로딩 상태 → 성공 시 온보딩으로 라우팅 |
| API 에러 | 토스트 또는 폼 최상단 에러 | "이미 가입된 이메일입니다" 등 |

### 키보드 네비게이션

- **Tab 순서**: Google → Apple → 이메일 → 닉네임 → 비밀번호 → 토글 → 약관1 → 약관2 → Submit
- **Enter**: 각 필드에서 Enter 시 다음 필드로 포커스 이동. 마지막 필드에서 Enter는 Submit.
- **Space**: 체크박스 토글

### 로딩/에러 상태

- **로딩**: Submit 버튼 내부에 스피너 + "가입 중..." 텍스트, 다른 필드 disable
- **에러**:
  - 필드별 에러: 해당 Input 하단에 `--danger` 색상 메시지
  - 전역 에러 (네트워크, 서버): 폼 상단에 인라인 alert
- **빈 상태**: N/A (폼 자체)

## 10. 반응형

### Mobile (<860px)

- **좌측 Brand Visual 영역 숨김** (`display: none`)
- 우측 Form Panel이 full width, 중앙 정렬
- Form max-width `360px` 유지
- Padding 축소: `24px`

### Desktop (≥860px)

- 기본 2열 레이아웃 (1:1 비율)
- 좌우 border로 분할

## 11. 접근성

- **ARIA 라벨**:
  - 비밀번호 토글 버튼: `aria-label="비밀번호 보기"` / `aria-label="비밀번호 숨기기"`
  - 강도 미터: `aria-label="비밀번호 강도: 강함"` (동적)
  - 에러 메시지: `aria-describedby`로 연결
- **포커스 관리**:
  - 페이지 진입 시 이메일 필드에 자동 포커스
  - API 에러 발생 시 첫 에러 필드로 포커스 이동
- **스크린 리더 대응**:
  - 강도 미터: `aria-live="polite"` 로 변경 알림
  - 에러 메시지: `role="alert"`
- **색상 의존 정보**: 비밀번호 강도는 막대 색상 + 텍스트("강함", "약함")로 이중 표기

## 12. 카피라이팅

### 화면 내 모든 텍스트

| 위치 | 텍스트 |
|------|--------|
| 좌측 Headline | 연애의 긴장은 아바타가, 결정은 당신이. |
| 좌측 Sub | AI 대리인을 소개팅에 파견하고, 관전하고, 결정적인 순간에만 개입하세요. 거절도 고스팅도 당신의 몫이 아닙니다. |
| Feature 1 제목 | 상처 없는 연애 |
| Feature 1 설명 | 아바타가 먼저 대화하고, 통과한 상대만 만납니다 |
| Feature 2 제목 | 관전하고 훈수두세요 |
| Feature 2 설명 | 다이아를 소모해 아바타의 다음 수를 결정할 수 있어요 |
| Feature 3 제목 | 나답게 움직이는 AI |
| Feature 3 설명 | Custom GPT 연동으로 당신의 말투와 성향을 학습합니다 |
| 우측 제목 | 계정 만들기 |
| 로그인 링크 | 이미 계정이 있으신가요? **로그인** |
| OAuth 1 | Google로 계속하기 |
| OAuth 2 | Apple로 계속하기 |
| Divider | OR |
| 이메일 라벨 | 이메일 |
| 이메일 placeholder | you@example.com |
| 닉네임 라벨 | 닉네임 |
| 닉네임 placeholder | 앱에서 표시될 이름 |
| 닉네임 helper | 영문, 숫자, 한글 · 2–12자 |
| 비밀번호 라벨 | 비밀번호 |
| 강도 힌트 (강함) | 강력함 · 10자 이상, 대소문자·숫자·기호 포함 |
| 강도 힌트 (중) | 보통 · 8자 이상 권장 |
| 강도 힌트 (약) | 약함 · 8자 이상 사용해주세요 |
| 필수 약관 | 만 19세 이상이며, **이용약관** 및 **개인정보처리방침**에 동의합니다 |
| 선택 약관 | 매칭 알림 및 서비스 업데이트 수신 (선택) |
| Submit | 계정 만들기 |
| Footnote | 본인 인증은 실제 매칭 시점에 진행됩니다 |

### 에러 메시지 (확정)

| 조건 | 메시지 |
|------|--------|
| 이메일 형식 오류 | 올바른 이메일 형식이 아닙니다 |
| 이메일 중복 | 이미 가입된 이메일입니다. 로그인해주세요 |
| 닉네임 길이 | 닉네임은 2자 이상 12자 이하로 입력해주세요 |
| 닉네임 중복 | 이미 사용 중인 닉네임입니다 |
| 비밀번호 약함 | 비밀번호는 8자 이상이어야 합니다 |
| 약관 미동의 | 필수 약관에 동의해주세요 |
| 네트워크 오류 | 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요 |
| 서버 오류 | 일시적인 오류가 발생했습니다. 계속되면 문의해주세요 |

## 13. 상태 머신

```
idle → submitting → success → (redirect to onboarding)
                 → error → idle (with error message)

oauth-loading → oauth-success → (redirect to callback)
             → oauth-error → idle
```

## 14. API / 데이터 의존성

| API | 메서드 | 엔드포인트 | 언제 호출 |
|-----|--------|-----------|-----------|
| Email Signup | POST | `/api/auth/signup` | 폼 제출 시 |
| OAuth Google | GET | `/api/auth/oauth/google` | Google 버튼 클릭 시 (redirect) |
| OAuth Apple | POST | `/api/auth/oauth/apple` | Apple 버튼 클릭 시 |
| Email duplicate check | GET | `/api/auth/check-email?email=` | blur + debounce 500ms |
| Nickname duplicate check | GET | `/api/auth/check-nickname?nickname=` | blur + debounce 500ms |

### 데이터 스키마

```ts
interface SignupPayload {
  email: string;
  nickname: string;
  password: string;
  termsAgreed: true;       // 항상 true (미동의 시 제출 불가)
  marketingAgreed: boolean;
}

interface SignupResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  onboardingStep: 'survey';  // 다음 진입할 온보딩 단계
}
```

## 15. 엣지 케이스

- **네트워크 오프라인**: 제출 시 네트워크 에러 토스트, 입력값은 보존
- **API 타임아웃**: 10초 후 재시도 버튼 표시, 30초 timeout
- **중복 제출**: 버튼 disable로 방지 (로딩 상태)
- **브라우저 뒤로가기 (제출 중)**: 경고 다이얼로그 ("아직 처리 중입니다. 나가시겠습니까?")
- **OAuth 팝업 차단**: 감지 시 "팝업을 허용해주세요" 안내
- **비밀번호 자동 채우기**: 브라우저 자동완성 허용 (`autocomplete="new-password"`)
- **복사 붙여넣기 (비밀번호)**: 허용 (비밀번호 관리자 호환성)

## 16. 참조 자료

- 참조 화면: `avating-design-v2.html` Section 01 (Signup)
- 관련 DSD: `signin.md`, `onboarding-survey.md`
- 디자인 시스템 문서: `07-patterns.md` 패턴 A, `06-components.md` Button/Input, `02-color.md`, `03-typography.md`

---

## Design Rationale

### 결정 1: OAuth 버튼을 이메일 폼 **위에** 배치

- **이유**: 대부분의 사용자가 OAuth를 선호한다는 데이터(일반적으로 60%+). 상단 배치로 가입 마찰 감소.
- **대안**: 이메일을 먼저 보여주고 OAuth를 하단에 배치 → 기각 (가입 마찰 증가)

### 결정 2: 본인 인증을 가입 시점이 아닌 **매칭 시점**으로 유예

- **이유**: 가입 중 본인 인증을 요구하면 이탈률이 급증. 매칭(실제 연결) 시점에만 필요한 정보이므로 필요 시점으로 유예.
- **대안**: 가입 시 즉시 본인 인증 → 기각 (이탈률 증가, 관전만 원하는 사용자에게 불필요)

### 결정 3: 브랜드 비주얼 영역에 **이미지 대신 그리드 배경**

- **이유**: 스톡 이미지는 AI스러움을 유발. Linear/Vercel 스타일의 그리드 배경이 관조적 톤과 맞음.
- **대안**: 커플 일러스트, 추상 그라데이션 → 기각 (톤 불일치)

### 결정 4: 비밀번호 강도 미터를 **4단계**로

- **이유**: 3단계(약/중/강)는 너무 단순해서 중간 단계 대부분이 "중"에 몰림. 5단계 이상은 과함.
- **대안**: zxcvbn 기반 5단계 점수 → 기각 (과도한 정확도보다 간결함 우선)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-18 | design-agent | 초기 승인. 디자인 시스템 v2 기반. |
