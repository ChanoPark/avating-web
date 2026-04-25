---
name: git-flow-public-repo
description: Git Flow 브랜치 전략 + Public Repository 보안 + 한글 Conventional Commits + AI committer 명시 — 이 프로젝트 모든 소스 형상관리의 최상위 정책
version: 1.0.0
source:
  - CLAUDE.md#커밋-PR
  - 사용자 지시 (2026-04-25)
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# Git Flow + Public Repository 형상관리 정책

> 이 문서는 **모든 다른 규칙보다 우선**한다. 특히 공개 저장소(Public GitHub Repository)
> 라는 전제에서 파생되는 보안 제약은 **예외 없음**이다.

연결 리모트: `https://github.com/ChanoPark/avating-web.git` (Public)

---

## 0. 철학

- **Public 저장소 = 전 세계에 공개**. 커밋된 순간 인터넷/크롤러/AI 학습 대상이 된다.
  `git revert` 해도 히스토리에 남고, force-push 로 지워도 포크·캐시·미러에 남는다.
  **한 번 노출된 키는 되돌릴 수 없다** — 반드시 로테이션.
- **AI 는 기본 신뢰하지 않음**. AI 가 만든 변경은 보안 위반 가능성이 0.1% 라도 있으면
  **사용자 승인 없이는 커밋·푸시 금지**.
- **실무 우선**. 이론적 깔끔함보다 "실수해도 사고 안 나는" 장치를 택한다.

---

## 1. Git Flow 브랜치 전략

```
main        ──●───────────●─────────●─────   (production, 보호됨)
              │           │         │
              └─ release/0.1.0 ─────┘
              │                     │
develop     ──●──●──●──●──●──●──●──●──●──    (integration, 기본 타겟)
                 │  │     │  │
                 │  │     │  └─ feature/login
                 │  │     └──── feature/avatar-create
                 │  └────────── feature/onboarding
                 └───────────── hotfix/critical-bug → main + develop
```

| 브랜치 | 용도 | 분기 원본 | 머지 대상 | 보호 |
|--------|------|-----------|-----------|------|
| `main` | 운영 배포 | — | (릴리즈/핫픽스만) | 직접 푸시 금지, PR + 리뷰 + CI 필수 |
| `develop` | 통합 기본 | `main` | `main` (릴리즈 시) | 직접 푸시 금지, PR + CI 필수 |
| `feature/<slug>` | 기능 개발 | `develop` | `develop` | — |
| `release/<x.y.z>` | 릴리즈 굳히기 | `develop` | `main` + `develop` 백머지 | — |
| `hotfix/<slug>` | 운영 긴급 패치 | `main` | `main` + `develop` 백머지 | — |

### 1.1 브랜치 명명
- **소문자 + 하이픈**. 한글 금지(호환성 이슈).
- 이슈 번호 있으면: `feature/123-login-flow`.
- `fix/*`, `chore/*`, `docs/*` 도 용도별로 허용 (develop 타겟).

### 1.2 AI 의 브랜치 운용 규칙
- **AI 는 `main` / `develop` 에 직접 커밋·푸시 금지**. 반드시 `feature/*` 등 작업 브랜치에서.
- PR 생성은 가능하나, **머지는 사용자만** 수행.
- 기존 원격 브랜치 삭제/force-push 금지 (사용자 명시 지시 있을 때만).

---

## 2. 커밋 메시지 — 한글 Conventional Commits

### 2.1 형식
```
<type>: <한글 요약 (50자 이내 권장, 100자 초과 금지)>

<본문 — 한글, 왜/배경 중심. 필요 시에만>

<trailer/footer>
```

### 2.2 Type (고정, 변경 금지)
| type | 사용 예 |
|------|---------|
| `feat` | 사용자에게 보이는 신규 기능 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변화 없는 구조/가독성 개선 |
| `perf` | 성능 개선 |
| `docs` | 문서만 변경 (`docs/`, `README`, `CLAUDE.md`, `.claude/notes`) |
| `test` | 테스트만 추가·수정 |
| `chore` | 빌드/설정/의존성 (코드 동작 영향 없음) |
| `ci` | GitHub Actions, 훅, 파이프라인 |
| `build` | 번들/빌드 시스템 |
| `style` | 포맷/세미콜론 등 (로직 무관) |
| `revert` | 이전 커밋 되돌리기 |

### 2.3 작성 규칙
- **요약 문장은 한글**. 명사/명사구 또는 `~했다 / ~추가 / ~수정` 형태.
- 영어 식별자(함수명·패키지명·파일명)는 영어 그대로 인용부호 없이 사용 가능.
  예: `feat: TanStack Query 로 세션 쿼리 훅 추가`
- 끝에 마침표 **금지**.
- `<type>` 뒤에 한 칸 띄고 `:` 사용. scope 는 선택: `feat(auth): ...`

### 2.4 본문 (Body)
- 왜(Why) 중심. 무엇(What) 은 diff 로 충분.
- 한글 작성. 기술 용어는 영문 유지 허용.
- 72자 줄바꿈 권장.

### 2.5 예시
```
feat: 회원 온보딩 페르소나 설문 플로우 초안 구현

- 온보딩 3단계 위저드(성향/관심사/연결 방식) 추가
- Zod 스키마로 단계별 입력 검증
- 현재는 MSW 핸들러로 모의 응답 처리

Committer: AI
```

```
fix(auth): 액세스 토큰 만료 시 무한 재시도 중단

refresh 엔드포인트가 401 반환 시 재시도 루프에 빠지는 문제.
인터셉터에서 refresh 실패 한 번이면 로그아웃 처리하도록 변경.

Committer: AI
```

---

## 3. Committer: AI 명시

### 3.1 필수 규칙
AI 가 만든 모든 커밋은 **커밋 메시지 본문 말미에 `Committer: AI` trailer** 를 포함해야 한다.
사용자가 직접 커밋하는 경우에는 trailer 를 **붙이지 않는다** — 이 trailer 의 유무가 AI/사용자 구분의 단일 기준.

### 3.2 구현 — 커밋 메시지 trailer
```
feat: 온보딩 위저드 초안 구현

- 3단계(성향/관심사/연결 방식) 구성
- Zod 로 각 단계 입력 검증

Committer: AI
```

### 3.3 환경변수 방식 미사용 이유
`GIT_COMMITTER_NAME` 환경변수로 committer 필드를 바꾸는 방식은
- 사용자가 같은 셸에서 직접 커밋할 때 오염 위험,
- 셸 세팅 관리 번거로움,
- git 사용자 메타데이터를 인위적으로 조작

등의 이유로 **이 프로젝트에서는 사용하지 않는다**. 사용자는 평소처럼 `git commit` 하면 되고,
AI 만 메시지 본문에 trailer 를 붙인다.

### 3.4 자동 감지 (사후 점검)
- PR 리뷰 또는 로컬에서 AI 커밋 확인: `git log --grep "Committer: AI"`.
- AI 커밋이라 표시된 것은 수동 리뷰 우선순위 상향.

### 3.5 `Co-Authored-By` 금지
- 사용자 글로벌 설정에서 자동 부여 비활성 상태. AI 가 임의로 추가 금지.
- `Signed-off-by` 도 사용자 지시 없는 한 추가 금지.

---

## 4. Public Repo 보안 — 절대 커밋 금지 목록

### 4.1 절대 업로드 금지 (즉시 차단 대상)
- **API Key / Access Token** — AWS, GCP, OpenAI, Anthropic, Stripe, Toss, GitHub PAT, Sentry auth token 등 모두.
- **Password** — DB, SMTP, Basic Auth, admin 등.
- **Private Key** — RSA/ED25519, SSH, PGP, TLS(`.pem`, `.key`, `.p12`, `.pfx`).
- **OAuth Client Secret** — Kakao, Naver, Apple, Google.
- **Webhook Signing Secret / HMAC Secret** — 결제 서명, GitHub webhook.
- **JWT 서명 키** — HS256 시크릿, RS256 private key.
- **서비스 계정 JSON** — `*-sa.json`, `service-account*.json`, `gcp-*.json`.
- **DB 접속 문자열** — `postgres://user:pass@host/db` 전체.
- **프로덕션 엔드포인트 중 비공개 내부 URL** — VPN-only, 프라이빗 서브넷 주소.
- **실제 회원 데이터** — 이메일, 전화번호, 메시지 본문 샘플 등 PII.

### 4.2 자동 감지 규칙 (AI 는 다음 패턴 발견 시 커밋 중단)
- `[A-Za-z0-9]{32,}` 형태의 긴 불투명 문자열이 env/config/code 에 하드코딩.
- `sk_live_`, `sk_test_`, `xoxb-`, `ghp_`, `ghs_`, `AKIA`, `ASIA` 로 시작하는 토큰 prefix.
- `-----BEGIN .* PRIVATE KEY-----` 블록.
- `password\s*[:=]\s*["'][^"']+["']` 패턴.

### 4.3 발견 시 프로토콜
1. **AI 는 즉시 커밋 중단**. 어떤 파일 어떤 라인에 무엇이 있는지 사용자에게 보고.
2. 사용자에게 다음 중 선택 요청:
   - 값을 `.env.*` 로 이관 후 `{PLACEHOLDER}` 로 치환
   - 해당 파일을 `.gitignore` 에 추가
   - 사용자가 직접 확인 후 직접 커밋
3. **이미 원격에 푸시되었다면 즉시 키 로테이션** — 히스토리 삭제는 불완전.

---

## 5. 플레이스홀더 + 환경변수 주입 패턴

### 5.1 기본 규칙
보안 위협이 되는 모든 값은 코드/설정에 **플레이스홀더**로 남기고, 실제 값은 환경변수로 주입한다.

```ts
// ❌ 금지
const client = new Stripe('sk_live_abc123...');

// ✅ 허용
const client = new Stripe(env.STRIPE_SECRET_KEY);
// env 스키마는 src/shared/config/env.ts 에서 Zod 파싱
```

### 5.2 문서/예시 코드 플레이스홀더 규약
공개 문서·예시에서는 **중괄호 표기**를 사용한다:
```
VITE_SENTRY_DSN={SENTRY_DSN}
VITE_AMPLITUDE_KEY={AMPLITUDE_KEY}
```

- `{}` 는 값이 **반드시 교체되어야 함**을 표시.
- `xxx`, `your-key-here`, `replace-me` 등 비표준 표기 사용 금지 (자동 탐지 방해).

### 5.3 `.env.example` 관리 (STRICT)
- **`.env.example` 은 키만 등록, 값은 비워둔다**. 형식: `KEY=` (등호 뒤 공백·기본값·플레이스홀더 모두 금지).
  - ❌ `VITE_API_MODE=mock`
  - ❌ `VITE_API_BASE_URL=https://api-staging.avating.com`
  - ❌ `VITE_SENTRY_DSN={SENTRY_DSN}`
  - ✅ `VITE_API_MODE=`
  - ✅ `VITE_API_BASE_URL=`
  - ✅ `VITE_SENTRY_DSN=`
- 변수 의미·예시·기본값은 **별도 문서**(`docs/` 또는 `.env.example` 상단 주석 블록)로 안내.
- 새 환경변수 추가 시 `.env.example` 동시 갱신 필수.
- PR 검토 시 `.env.example` diff 가 없는데 코드에서 `env.XXX` 참조가 생기면 거절.

### 5.4 실제 `.env` 파일 — 절대 커밋 금지
- `.env`, `.env.development`, `.env.staging`, `.env.production`, `.env.local`, `.env.*.local` 등 **`.env.example` 외 모든 `.env*` 파일은 커밋 금지**.
- `.gitignore` 에서 `.env.*` 차단 + `!.env.example` 예외로 강제.
- 실제 값은 개발자 로컬 `.env.local` 또는 배포 환경 시크릿 매니저(GitHub Actions Secrets, AWS SSM Parameter Store 등)로만 주입.

### 5.4 프론트 공개값 vs 비밀값
- `VITE_*` 접두사 환경변수는 **빌드 번들에 인라인**되어 공개된다.
  → 공개되어도 무해한 값만(엔드포인트, 공개 DSN 등).
- 비밀값은 **절대 `VITE_*` 로 두지 않는다**. 프론트 전담 아니므로 백엔드에 위임.

---

## 6. `.gitignore` 프로토콜

### 6.1 최초 1회 사용자 검토 의무
- AI 가 생성·수정한 **최초 `.gitignore` 는 반드시 사용자 검토 후 커밋**.
- AI 는 변경 제안(diff)만 제시하고, 사용자 승인 없이는 커밋 안 함.
- 이후 개별 항목 추가(특정 도구 캐시 등)는 AI 가 커밋 가능하나,
  **보안 관련 항목 추가·제거**는 다시 사용자 검토.

### 6.2 권장 `.gitignore` 구조 (카테고리별)

```gitignore
# ── 의존성 / 빌드 산출물
node_modules
dist
dist-ssr
.vite
*.tsbuildinfo

# ── 환경 변수 (보안 ─ Public Repo 에서는 .env.example 외 전부 금지)
.env
.env.*
!.env.example

# ── 비밀 파일 (키/인증서)
*.pem
*.key
*.p12
*.pfx
*.crt
*.cer
id_rsa
id_ed25519
known_hosts
.ssh/

# ── 클라우드 자격증명
.aws/
.gcloud/
gcp-*.json
*-sa-*.json
service-account*.json
credentials.json
secrets.json
secret.json

# ── 관측성 도구 토큰
.sentryclirc
.amplitude/

# ── 로그
*.log
npm-debug.log*
pnpm-debug.log*
yarn-error.log

# ── 테스트 / 커버리지
coverage
playwright-report
test-results
blob-report
.nyc_output

# ── Storybook
storybook-static
.storybook-static

# ── 에디터 / OS
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
Thumbs.db
*.swp
*.swo
*.suo

# ── 도구 캐시
.eslintcache
.turbo
.cache
.parcel-cache

# ── Terraform (추후 도입 시)
*.tfstate
*.tfstate.*
*.tfvars
!*.tfvars.example
.terraform/

# ── Claude / AI 로컬 설정
.claude/settings.local.json

# ── 기타 로컬 전용
*.local
tmp/
.tmp/
```

### 6.3 `.env.development` 처리
- **결정**: `.env.*` 전체 ignore + `.env.example` 만 허용 (strict 모드).
- 개발 기본값은 `.env.example` 에 주석으로 안내.
- 팀원은 복사해서 `.env.local` 또는 `.env.development.local` 로 운영.

---

## 7. 코드 작성 시 Public Repo 인식

### 7.1 하드코딩 금지 대상
- API Base URL 중 **내부/프라이빗 호스트** (staging 도 외부 공개라면 OK).
- 직원 이메일, 슬랙 채널 이름, 내부 JIRA 티켓 URL.
- 서버 로그 포맷 예시에 실제 유저 ID, 세션 ID.
- 내부 온콜 연락처, 비상 전화번호.

### 7.2 테스트 데이터 / 픽스처
- 실제 회원 데이터·실제 결제 내역 사용 금지.
- 이메일은 `@example.com` 도메인.
- 전화번호는 `010-0000-0000` 같은 명백히 가짜 값.
- 아바타 샘플 이미지는 **라이선스 명확한 것** 또는 AI 생성물.

### 7.3 주석/문서
- 내부 전용 농담, 팀 내부 슬랭, 다른 사람 실명 비판 금지.
- 취약점·보안 이슈는 공개 커밋 메시지에 구체적 설명 금지
  (수정은 하되 메시지는 "보안 강화" 수준으로).
- TODO 에 민감 정보(내부 URL, 티켓 번호 외 세부) 금지.

---

## 8. AI 커밋 승인 프로토콜

AI 는 **커밋/푸시 직전** 다음을 자동 점검하고, 하나라도 걸리면 사용자 승인을 받아야 한다.

- [ ] 스테이징된 파일 중 `.env*`(예외: `.env.example`) 가 없는가?
- [ ] 4.2 의 시크릿 패턴이 diff 에 없는가?
- [ ] 새 파일이 `.pem/.key/.json(secret류)` 확장자/이름이 아닌가?
- [ ] 커밋 메시지가 한글 Conventional Commits 규격인가?
- [ ] 메시지 본문에 `Committer: AI` trailer 가 포함되어 있는가?
- [ ] 대상 브랜치가 `main` / `develop` 이 아닌가? (AI 는 직접 커밋 금지)
- [ ] 사용자가 **최초 `.gitignore`** 를 검토했는가? (최초 1회 한정)

하나라도 "아니오"면 → 중단 → 사용자에게 상황 보고 및 지시 요청.

---

## 9. PR 프로세스

### 9.1 PR 생성
- 타겟: 대부분 `develop`. 릴리즈/핫픽스만 `main`.
- 제목: 한글 Conventional Commits 형식 (`feat: ...`).
- 본문(템플릿):
  ```markdown
  ## 요약
  - 변경 핵심 1~3줄 (한글)

  ## 배경/이유
  - 왜 필요한 변경인지

  ## 변경 내역
  - [ ] 주요 변경 파일/모듈

  ## 테스트 계획
  - [ ] 유닛
  - [ ] 통합
  - [ ] E2E / 수동

  ## 위험/주의
  - 보안·성능·호환성 영향

  ## 스크린샷 / 로그 (선택)
  ```

### 9.2 리뷰 기준
- `CLAUDE.md` 품질 기준 (타입체크/린트/테스트 커버리지/번들 예산) 통과.
- 본 Skill 의 보안 체크리스트 통과.
- 연관 Skill (`git-hooks-commits`, `code-quality` 등) 규칙 준수.

### 9.3 머지
- **Squash merge** 기본 — `develop` 히스토리 깔끔 유지.
- `release/*` → `main` 은 **Merge commit** 으로 진행 (태그 기준점 명확화).
- 머지 후 feature 브랜치 즉시 삭제.

---

## 10. 체크리스트 (AI 가 매 작업마다 참조)

### 변경 시작 전
- [ ] `git status` 확인, 작업 브랜치 정리 (`feature/*`).
- [ ] 최신 `develop` 에서 분기.

### 변경 중
- [ ] 비밀값 하드코딩 금지, 플레이스홀더 사용.
- [ ] 새 환경변수 → `.env.example` + `src/shared/config/env.ts` 동시 갱신.
- [ ] 테스트 데이터는 가짜 값 사용.

### 커밋 전
- [ ] `git diff --staged` 로 시크릿 패턴 최종 검증.
- [ ] 한글 Conventional Commits 메시지.
- [ ] 메시지 본문 말미에 `Committer: AI` trailer 삽입.
- [ ] 적절한 입도로 분할 (1 커밋 = 1 논리 단위).

### 푸시 전
- [ ] `main` / `develop` 타겟 아닌지 재확인.
- [ ] 훅 통과 확인 (lint-staged, commitlint). `--no-verify` 금지.

### PR 전
- [ ] 템플릿 채움.
- [ ] CI 녹색 대기.
- [ ] 머지는 사용자.

---

## 11. AI 자동 커밋 전 코드 리뷰 절차 (MUST)

> AI 가 `git commit` 을 실행하기 직전 **항상** 수행한다. 한 단계라도 건너뛰면 커밋 금지.

### 11.1 절차 (순서 고정)

**1단계 — 스테이징 확정 및 diff 정독**
- `git status` 로 스테이지/언스테이지 상태 확인.
- `git diff --staged` 전체를 읽는다. 한 줄도 건너뛰지 않음.
- 의도치 않은 파일·변경이 섞였으면 unstage.

**2단계 — 자가 리뷰 체크리스트**
- [ ] 요구사항과 diff 가 일치한다 (과·부족 없음).
- [ ] CLAUDE.md 규칙 준수: 레이어 방향, 파일 크기(200~400 권장, 800 금지), 불변성, 주석 정책.
- [ ] 관련 Skill MUST 규칙 위반 없음 (예: `typescript-strict`, `code-quality`, `forms-rhf-zod`, `error-suspense-boundary` 등 변경 영역에 해당하는 것).
- [ ] 함수 ≤ 50 라인, 중첩 ≤ 4, 매직넘버/하드코딩 없음.
- [ ] 신규 환경변수는 `.env.example` 과 `src/shared/config/env.ts` 스키마에 동시 추가.

**3단계 — 보안 스캔 (본 Skill section 4.2 패턴)**
- 시크릿 prefix(`sk_*`, `ghp_`, `AKIA` 등) 탐지.
- `-----BEGIN .* PRIVATE KEY-----` 블록 탐지.
- 32자 이상 불투명 문자열 하드코딩 탐지.
- `.env*` 파일 스테이징 여부(`.env.example` 만 허용).
- 하나라도 걸리면 **즉시 중단 → 사용자 보고 → 승인 대기**.

**4단계 — 품질 게이트 (변경 범위에 비례)**
| 변경 유형 | 최소 실행 |
|-----------|-----------|
| 설정/문서만 (`chore/docs`) | 생략 가능 (단, `commitlint` 는 훅이 실행) |
| TS/TSX 코드 변경 | `pnpm typecheck` + 변경 파일 `pnpm lint` |
| 로직 변경 | 위 + `pnpm test` (영향 범위 또는 전체) |
| 의존성 변경 | 위 + `pnpm install` 재검증 + `pnpm build` 스모크 |
| `.gitignore` / 보안 관련 | 사용자 승인 (§6) |

훅(`pre-commit`, `commit-msg`)과는 **별개**로 AI 가 선제 실행한다. 훅이 잡아주는 건 보너스.

**5단계 — 리뷰 규모 판단**
- **경량 (≤50 라인, 단일 파일, 로직 단순)**: 인라인 자가리뷰로 충분.
- **중량 (> 50 라인 또는 복수 파일 또는 로직 복잡)**: `code-reviewer` 서브에이전트 호출 후 CRITICAL/HIGH 이슈 해결.
- **보안·성능·공개 API 영향 가능**: `security-reviewer` + `code-reviewer` 병렬 호출 권장.

**6단계 — 사용자 보고 & 커밋 결정 (반드시 멈춤)**

AI 는 리뷰 결과를 다음 포맷으로 보고하고 **반드시 멈춰서 사용자 승인을 기다린다**.
승인 없이는 절대 `git commit` 실행 금지.

보고 포맷:
```
[리뷰 요약]
- 변경 파일 N 개 / 추가 +X / 삭제 -Y
- 자가 리뷰: 통과 (또는 발견 이슈 목록)
- 보안 스캔: 통과
- 품질 게이트: typecheck ✓ / lint ✓ / test ✓ (또는 실패 사유)

[스테이지 요약]
- file1.ts: 새 파일
- file2.tsx: 수정 (+12 / -3)
...

[커밋 메시지 초안]
<type>: <한글 요약>

<본문>

Committer: AI

[다음 행동]
사용자 승인 시 위 내용으로 커밋합니다. 수정/취소가 필요하면 알려주세요.
```

승인 형태:
- **개별 승인** (기본): 사용자가 "커밋해줘" / "OK" 등 명시적 승인을 해야만 AI 가 그 1건 커밋.
- **세션 한정 자동 승인**: 사용자가 "이번 세션은 자동으로 커밋 진행해" 등으로 명시 허용 시,
  해당 세션 동안 AI 가 보고 후 자동 커밋 가능. 단:
  - 자동 진행 중이라도 **보안 스캔 실패·게이트 실패 시 즉시 중단**.
  - 새 세션이 시작되면 자동 승인 권한은 **자동 만료**, 다시 명시 허가 필요.
  - 자동 진행 중에도 매 커밋의 보고는 **반드시 사용자에게 보여**준다 (조용히 진행 금지).
- **그 외 일체의 자동 커밋 금지**.

이슈 처리:
- 이슈 발견 시 **무조건 커밋 중단**, 사용자 보고 후 지시 대기.
- 자동 승인 범위라도 이슈 발견 시 자동 모드 일시 해제.

### 11.2 금지 행위
- `--no-verify` 로 훅 우회 금지.
- 리뷰 단계 중 품질 게이트 실패를 "작은 경고라서" 무시 금지.
- 여러 논리 단위를 한 커밋으로 묶는 것(리뷰 부담 가중) 금지. 분할 후 각각 리뷰.
- 리뷰 보고 없이 조용히 커밋 금지.
- **사용자 명시 승인(개별 또는 세션 한정 자동) 없이 AI 가 단독 커밋 금지** — 어떤 작은 변경이라도 예외 없음.
- 세션 한정 자동 승인을 다음 세션으로 이월 금지.

### 11.3 실패·중단 시 기록
- 리뷰 중 발견된 이슈가 즉시 해결 불가면 `.claude/notes/` 하위에 간단히 기록(선택).
- 같은 실수를 반복하면 본 Skill 에 규칙으로 승격.

---

## 12. 참고

- 본 Skill 과 [git-hooks-commits](../git-hooks-commits/SKILL.md) 은 상호 보완:
  - 본 Skill = **정책(무엇을/왜)** + Public Repo 보안 + 브랜치 전략.
  - `git-hooks-commits` = **도구(어떻게)** — Husky/lint-staged/commitlint 설정.
- 충돌 시 **본 Skill 이 우선**.

---

## 변경 이력
- 1.0.0 (2026-04-25): 사용자 지시 기반 최초 작성.
