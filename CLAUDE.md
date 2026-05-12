> **IMPORTANT**: 기본적인 의사 결정은 반드시 **karpathy-guidelines**에 정의된 것을 기본으로 하되, 대규모 환경에서의 확장성과 유지보수를 고려할 것. 두 원칙이 충돌하는 경우(예: 단순함 vs 확장성)에는 어떤 트레이드오프인지 명시하고 사용자에게 판단을 구한다.

> **PUBLIC REPOSITORY (1급 보안 경고)**: 이 저장소는 `https://github.com/ChanoPark/avating-web` (Public)이다. **커밋된 순간 전 세계에 공개**되며 `git revert`·force-push 로도 포크/캐시/AI 학습본까지 회수 불가. 모든 코드 작성/커밋/PR 결정은 [§ 보안 (1급)](#보안-1급) 절을 먼저 통과해야 한다. 단일 출처: [`.claude/skills/git-flow-public-repo/SKILL.md`](.claude/skills/git-flow-public-repo/SKILL.md).

# 아바팅(Avating) Web

> 사용자가 자신을 닮은 AI 아바타를 만들고, 아바타끼리 소개팅을 대신 수행하게 한 뒤, 그 과정을 실시간으로 관전하고 개입하는 **인터랙티브 게임**.

데이팅 앱이 아닌 **시뮬레이션 게임**으로 포지셔닝한다 — 사용자는 플레이어, 아바타는 캐릭터, 소개팅 결과는 SNS 공유 가능한 콘텐츠. 결제(다이아/매칭 티켓)가 있는 실서비스이므로 **성능·유지보수·관측성·보안·배포 안정성**을 1급 관심사로 둔다.

> 서비스 정의/유저 플로우/용어의 단일 출처: [.claude/docs/project-overview.md](.claude/docs/project-overview.md).
> 인프라/단계별 구축 계획: [.claude/plans/project-setup-plan.md](.claude/plans/project-setup-plan.md).
> 도메인/플로우/엔티티/API narrative/ADR 의 atomic 페이지·변경 이력·코드 매핑: [.claude/wiki/](.claude/wiki/) (wiki-maintainer 스킬 경유 갱신, project-overview.md 의 derived view).

---

## 서비스 요약

- **타겟**: 관계 리스크는 피하되 연애 도파민은 원하는 2030.
- **핵심 가치**: "내 AI 아바타가 대신 소개팅, 나는 관전+코칭. 리스크 0%, 본캐 연결은 선택."
- **해결 문제**: 첫 메시지/대화 유지 부담 → AI 가 대신 / 매칭 후 대화 소재 부재 → 시뮬레이션 자체가 icebreaker.
- **BM**: 다이아(코칭/블라인드 해제/대기 단축) · 매칭 티켓(본캐 연결) · 프리미엄 구독(인증 배지·고급 필터).

## 핵심 유저 저니

1. **회원가입/로그인** → 2. **아바타 생성**(성격·가치관·말투 입력 → AI 페르소나 구성) → 3. **매칭**(시스템 자동 탐색) → 4. **시뮬레이션 관전**(AI-to-AI 자동 대화, 특정 턴에 코칭 개입 가능) → 5. **결과 리포트**(호감도·하이라이트, SNS 공유) → 6. **본캐 연결**(양측 동의 + 매칭 티켓 + 본인 인증 시 1:1 채팅 오픈).

## 사용자 상태

| 상태         | 설명                        |
| ------------ | --------------------------- |
| `ONBOARDING` | 가입 후 아바타 미생성       |
| `READY`      | 아바타 생성 완료, 매칭 가능 |
| `WAITING`    | 매칭 상대 탐색 중           |
| `WATCHING`   | 시뮬레이션 관전 중          |
| `REVIEWING`  | 결과 리포트 확인 중         |
| `CHATTING`   | 본캐 채팅 중                |

## 용어 (고정)

- **사용자(Member)** 실사용자 / **아바타(Avatar)** 사용자의 성격·가치관·말투를 학습한 AI 페르소나 (1인당 다수 생성 가능) / **페르소나(Persona)** 아바타의 성향.
- **매칭(Matching)** 아바타 간 소개팅 시뮬레이션 / **매칭 세션(Matching Session)** 두 아바타의 시뮬레이션 단위 / **턴(Turn)** 한 아바타의 발화 단위.
- **관전(Watching)** 자기 아바타와 상대 아바타의 대화를 실시간 지켜보는 행위.
- **코칭(Coaching)** = **훈수(Intervention)** — 관전 중 다이아 소모로 다음 발화 방향에 프롬프트 주입. (코드/문서 신규 작성 시에는 `coaching` 우선 사용)
- **호감도(Affinity)** 시뮬레이션 종료 후 산출되는 양측 상호 호감 점수(0~100).
- **결과 리포트(Result Report)** 시뮬레이션 완료 후 호감도·하이라이트 요약·매칭 결과.
- **본캐(Real Self)** 아바타가 아닌 실제 사용자 본인 / **본캐 연결(Real Connect)** 양측 동의 시 실제 유저 간 채팅 오픈.
- **연결 코드(Connect Code)** Custom GPT ↔ 시스템 매핑용 1회성 코드 (Valkey 임시 저장).

---

## 기술 스택

| 영역              | 선택                                                                                         | 비고                                        |
| ----------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 언어/런타임       | TypeScript 5, Node.js 22 LTS                                                                 | `.nvmrc` + corepack 고정                    |
| 패키지 매니저     | pnpm                                                                                         | 프로젝트 표준                               |
| 프레임워크        | React 19, Vite 6                                                                             |                                             |
| 라우팅            | React Router v7                                                                              | **library mode (SPA)** — CloudFront/S3 정합 |
| 스타일            | Tailwind CSS 4, Motion(`motion/react`), Lucide React                                         | Tailwind v4는 Lightning CSS                 |
| 서버 상태         | TanStack Query v5 + Axios                                                                    | 인터셉터/토큰 갱신                          |
| 클라이언트 상태   | Zustand                                                                                      | 인증/UI 토글만                              |
| 폼/검증           | React Hook Form + Zod                                                                        | `@hookform/resolvers/zod`                   |
| 로딩/에러         | React Suspense + `react-error-boundary`                                                      |                                             |
| 모킹              | MSW                                                                                          | **dev/test에서 유지 필수**                  |
| 테스트            | Vitest + RTL / Playwright(E2E) / `@axe-core/playwright` / Lighthouse CI                      |                                             |
| 카탈로그          | Storybook 8 + a11y addon                                                                     |                                             |
| 품질              | ESLint 9(flat) + typescript-eslint + boundaries + jsx-a11y + tailwindcss / Prettier 3 / Knip |                                             |
| Git 훅            | Husky + lint-staged + commitlint                                                             | Conventional Commits                        |
| 관측성            | Sentry(에러+RUM+소스맵) · Amplitude(제품 분석)                                               |                                             |
| 운영 로그         | ELK (백엔드/인프라 공용)                                                                     | 웹 RUM과 역할 분리                          |
| 피처 플래그       | GrowthBook                                                                                   | Cloud → 추후 self-host                      |
| 인프라            | AWS CloudFront+S3(OAC) · ACM · Route53 · WAF                                                 |                                             |
| IaC               | Terraform                                                                                    | S3 remote state + DynamoDB lock             |
| CI/CD             | GitHub Actions + GitHub OIDC → IAM Role                                                      |                                             |
| 결제(예정)        | 토스페이먼츠 / 포트원                                                                        | 서명은 백엔드 위임                          |
| 소셜 로그인(예정) | Kakao / Naver / Apple / Google                                                               |                                             |

---

## 프로젝트 구조 원칙

- **레이어**: `app > pages > features > entities > shared`. 역방향 의존 금지 (`eslint-plugin-boundaries`로 강제).
- **경로 별칭**: `@/`(src), `@shared/`, `@features/`, `@entities/`, `@pages/` — tsconfig/vite/vitest 공통 적용.
- **파일 크기**: 200~400 라인 권장, 800 라인 초과 금지. 기능/도메인 기준 분리(타입 기준 분리 금지).
- **불변성**: 객체는 항상 새로 만들어 반환, 원본 변이 금지.
- **사용자 상태 모델**: 위 6개 상태(`ONBOARDING`~`CHATTING`)는 entities 레이어에서 단일 타입(`MemberStatus`)으로 표현. 화면/라우팅은 이 상태에 종속 — 임의 분기 금지.

## 보안 (1급)

> 이 절은 모든 다른 규칙보다 우선한다. Public Repo 라는 전제에서 파생된 제약은 예외 없음.

### 절대 커밋 금지 (즉시 차단 대상)

- **시크릿**: API Key/Access Token (AWS/GCP/OpenAI/Anthropic/Stripe/Toss/GitHub PAT/Sentry auth), Password, Private Key (`*.pem` `*.key` `*.p12` `*.pfx` `id_rsa` `id_ed25519`), OAuth Client Secret (Kakao/Naver/Apple/Google), Webhook/HMAC Signing Secret, JWT 서명 키, 서비스 계정 JSON (`*-sa.json`/`service-account*.json`/`gcp-*.json`), DB 접속 문자열(전체).
- **자동 탐지 패턴**: `sk_live_` / `sk_test_` / `xoxb-` / `ghp_` / `ghs_` / `AKIA` / `ASIA` 접두 토큰, `-----BEGIN .* PRIVATE KEY-----` 블록, env/config/code 에 하드코딩된 32자 이상 불투명 문자열, `password\s*[:=]\s*["'][^"']+["']`.
- **PII / 내부 정보**: 실제 회원 데이터(이메일·전화·메시지 본문), 직원 이메일·슬랙 채널·내부 JIRA URL, VPN-only/프라이빗 서브넷 호스트, 온콜 연락처. 픽스처는 `@example.com` / `010-0000-0000` 등 명백한 가짜 값 사용.
- **취약점 설명**: 커밋 메시지에 보안 이슈의 구체적 재현 경로 금지 — "보안 강화" 수준 표현으로 한정.

### 이중 방어 (6계층)

| #   | 계층                                                          | 역할                                                          | 현재 상태                                                                                                            |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| L1  | 코드/문서 정책 (CLAUDE.md + `git-flow-public-repo`)           | 하드코딩·PII 금지, 플레이스홀더 강제                          | ✅                                                                                                                   |
| L2  | `.gitignore`                                                  | `.env.*`(예외 `.env.example`)·키·자격증명·SA JSON 차단        | ✅                                                                                                                   |
| L3  | `.env.example` STRICT (키만, 값 비움)                         | 신규 변수 누락 + 값 누출 동시 차단                            | ⚠️ 현재 위반 — `.env.example` 에 값/중복 존재. 키만 남기도록 정리 필요                                               |
| L4  | Husky pre-commit (lint-staged + 시크릿 스캔)                  | 푸시 전 staged diff 차단                                      | ⚠️ `.husky/` 가 `.gitignore` 로 차단되어 새 클론·CI 머신에서 자동 동작 안 함 → 클론 시 셋업 가이드 필수 + L5 로 보강 |
| L5  | CI 시크릿 스캐닝 (gitleaks/trufflehog, GitHub Actions)        | history 전체 + push 단계 차단                                 | ❌ `.github/workflows/` 부재 — **도입 필수**. 도입 전까지는 사람이 모든 커밋 수동 검토                               |
| L6  | GitHub Native: Secret Scanning + Push Protection + Dependabot | Public Repo 에서 자동 활성, 패턴 한정 보호                    | ✅ (Repo 설정에서 활성 확인)                                                                                         |
| L+  | AI 게이트 (`commit-work` → `pr-code-reviewer-iterative`)      | AI 발화 경로 한정 — 사람 직접 커밋은 우회됨                   | ✅ 단 우회 가능                                                                                                      |
| L+  | wiki-maintainer INGEST 사전 스캔                              | raw/ 저장 전 시크릿/PII 차단 — wiki 가 누출 채널 되는 것 방지 | ✅ (스킬 도입 시 자동)                                                                                               |

L3·L4·L5 는 현재 결함. L4 가 작동하지 않는 한 **L5 (CI gitleaks) 가 사실상 유일한 자동 방어**이므로 우선 도입 대상으로 둔다.

### 환경변수 / 플레이스홀더 규약

- 비밀값은 **절대 프론트에 두지 않음**. `VITE_*` 는 빌드 번들에 인라인 → 공개되어도 무해한 값(공개 엔드포인트, 공개 DSN)만.
- 신규 환경변수 추가 시 `.env.example` 과 `src/shared/config/env.ts` Zod 스키마를 **동시 갱신**. PR 검토 시 한쪽만 변경되어 있으면 거절.
- `.env.example` 은 `KEY=` 형식, 등호 뒤 공백·기본값·플레이스홀더 모두 금지. 기본값 안내가 필요하면 파일 상단 주석 블록 또는 README 로 분리.
- 문서/예시 코드의 플레이스홀더는 `{KEY_NAME}` 중괄호 표기로 통일 (`xxx`/`your-key-here`/`replace-me` 금지 — 자동 탐지 방해).

### 발견 시 프로토콜 (시크릿/PII 감지 즉시)

1. **모든 커밋·푸시 즉시 중단**. AI 는 어느 파일 어느 라인에 무엇이 있는지 사용자에게 보고.
2. 사용자에게 선택 요청: ① 값을 `.env.local` 로 이관 + 코드는 `env.X` 참조로 치환 / ② 해당 파일 `.gitignore` 추가 / ③ 사용자가 직접 검토 후 커밋.
3. **이미 원격에 푸시되었다면 즉시 키 로테이션** — `git filter-repo`/force-push 는 포크/캐시 잔존으로 불완전 복구. 영향 범위(어떤 키가, 언제부터 노출됐는지)도 함께 보고.

### AI 커밋·PR 보안 게이트 (요약, 자세한 절차는 `git-flow-public-repo §11`)

AI 는 `git commit` 직전 다음을 **모두** 통과시키고 사용자 승인을 받아야 한다.

- [ ] 스테이징된 파일 중 `.env*`(예외 `.env.example`) 없음
- [ ] 위 자동 탐지 패턴 diff 에 없음
- [ ] 신규 파일이 `.pem`/`.key`/`secret*.json` 류 확장자/이름 아님
- [ ] PII/내부 URL/직원 정보 없음
- [ ] 신규 env 변수가 있다면 `.env.example` + Zod 스키마 동시 변경됨
- [ ] 대상 브랜치가 `main`/`develop` 아님 (AI 직접 커밋 금지)

하나라도 실패 → 중단 → 사용자 보고. 자동 진행 모드라도 **시크릿 의심 시 자동 모드 즉시 해제**.

---

## Wiki 시스템

이 프로젝트는 LLM Wiki 패턴을 따른다. **3계층 구조**로 단일 출처 원칙을 유지한다.

| 계층                             | 위치                               | 유지 주체            | 담는 것                                      |
| -------------------------------- | ---------------------------------- | -------------------- | -------------------------------------------- |
| 정책·스키마                      | `CLAUDE.md` (이 파일)              | 사람                 | 보안·의사결정·게이트·기술 스택               |
| 마스터 narrative                 | `.claude/docs/project-overview.md` | **사람**             | 서비스 정의·유저 플로우·용어 (단일 출처)     |
| Atomic 페이지 + 이력 + 코드 매핑 | `.claude/wiki/`                    | wiki-maintainer 스킬 | domains/flows/apis/entities/ui/decisions/raw |

### 단일 출처 원칙

`.claude/wiki/` 는 `project-overview.md` 의 분해된 **derived view + 변경 이력 + 코드 동기화 layer** 다.

- 동일 사실이 둘에 등장하면 **`project-overview.md` 가 우선**. wiki 페이지는 frontmatter `surfaced-in: .claude/docs/project-overview.md#<anchor>` 로 derive 관계 명시 (해당 사실이 project-overview.md 에서 파생된 경우에만).
- 사용자 발언으로 진실이 바뀌면 wiki-maintainer **INGEST** 가 raw 저장 + wiki 갱신 + `project-overview.md` 갱신 필요 여부를 사용자에게 **보고만** 한다. project-overview.md 는 사용자의 확인 후 수정.
- 코드 변경 시 dev-avatar 가 **UPDATE** 호출 → wiki 만 갱신. project-overview.md 반영 여부는 사용자 검토 후 수동.
- karpathy-guidelines 는 모든 의사결정의 baseline. `wiki/decisions/000-karpathy-baseline.md` 가 우선 출처. 결제/매칭/관측성처럼 대규모 영향 영역은 확장성 가중치를 별도 ADR 로 분리해 트레이드오프를 명시.

### 운영 규칙

- 모든 sub-agent 는 작업 시작 전 wiki-maintainer **QUERY** 로 컨텍스트 로드 (읽기 전용, 토큰 불요).
- **INGEST 트리거 판정 의무는 turn 첫 단계의 응답 주체가 가진다.**
  - avatar 서브에이전트가 활성이면 → avatar 가 판정, 매칭 시 `wiki-avatar` 에 Agent 위임 (avatar 본인은 Bash/Edit/Write 부재).
  - **avatar 미경유 (사용자가 main Claude 에 직접 작업 지시) 인 경우 → main Claude 가 동일한 판정 의무를 가진다.** [.claude/skills/wiki-maintainer/modes/INGEST.md § 1. 트리거 판정](.claude/skills/wiki-maintainer/modes/INGEST.md) 의 신호 표로 매 사용자 발언을 검사. 매칭 시 main Claude 가 직접 wiki-maintainer SKILL 의 INGEST 절차를 수행 (Bash 로 토큰 발급/회수 + Edit/Write 로 raw 저장·페이지 갱신). 이 의무가 없으면 초기 단계의 빈번한 사양 변경이 wiki 에 박제되지 않아 시스템 진실이 유실된다.
  - 판정이 모호하면 INGEST 한다 (false negative > false positive 비용).
- dev-avatar 는 작업 종료 직전 **UPDATE** 호출 의무 (자체 Bash/Edit/Write 로 수행).
- pr-code-reviewer 는 PR 검증 5축에 **Wiki Drift** 포함, **LINT** 호출 (자체 도구로 수행).
- `.claude/api/openapi.yaml` 은 API 계약의 단일 진실. `wiki/apis/*` 는 narrative 만 담는다 (스키마 중복 금지).
- **어떤 에이전트도 `.claude/wiki/**` 를 직접 편집하지 않는다** — wiki-maintainer 스킬(또는 wiki-avatar 에이전트) 경유만. PreToolUse hook (`wiki-write-gate.sh`, `wiki-bash-gate.sh`)이 강제.
- 토큰은 모드별 분리 — `.claude/.wiki-edit-token.{ingest,update,lint}`. 동시 활성 가능 (호출자 경합 방지).
- **drift 용어 단일 정의**는 [.claude/skills/wiki-maintainer/SKILL.md § 2.8](.claude/skills/wiki-maintainer/SKILL.md) 단일 출처. settings.json 의 git commit pre-hook 은 `update-lag` 만 검사 (커밋 직전 staged set 기반 빠른 차단), LINT 는 `content-drift / orphan-code / stale-ref` 를 검사 (전수 점검) — 역할이 다르므로 중복 아님.

### 보안 1급 통합

- INGEST 는 raw 저장 **전** 시크릿/PII 스캔. CLAUDE.md [§ 보안 (1급) — 자동 탐지 패턴](#보안-1급) 위반 시 raw 자체 거부 + 사용자 보고.
- LINT 는 보안 카테고리를 1순위 CRITICAL 로 검사. wiki 본문/raw/페이지 frontmatter 어디서든 시크릿·PII 흔적 발견 시 즉시 보고.
- `.env.example` ↔ `src/shared/config/env.ts` Zod 스키마 동시 갱신 검증을 UPDATE/LINT 가 자동 수행.
- wiki 가 새로운 시크릿 누출 채널이 되는 것을 차단한다.

자세한 규칙: [.claude/skills/wiki-maintainer/SKILL.md](.claude/skills/wiki-maintainer/SKILL.md).

---

## 환경 및 배포

- **환경**: `development`(MSW 우선) / `staging` / `production`.
- **env 파싱**: `src/shared/config/env.ts`에서 Zod로 런타임 파싱 — 실패 시 앱 부팅 크래시.
- **env 노출**: 클라이언트는 `VITE_*` 접두사만. 비밀값(결제/OAuth 서명)은 **절대 프론트에 두지 않음**. 자세한 규약은 [§ 보안 (1급)](#보안-1급).
- **스테이징**: `staging.avating.com` — Basic Auth, `robots.txt: Disallow: /`, 결제 테스트 키.
- **운영**: `avating.com` — Origin Shield ICN, PriceClass_200, WAF managed rules, Brotli, HTTP/3.
- **배포**: `main` 머지 → 스테이징 자동 / `v*.*.*` 태그 → 운영 수동 승인.

## 품질 기준 (CI에서 강제)

- `tsc --noEmit` (strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes + noImplicitOverride).
- ESLint `--max-warnings=0`, Prettier `--check`.
- 테스트 커버리지 80%+ (`vitest --coverage`, v8 provider).
- Playwright: chromium + webkit 매트릭스 (iOS Safari 호환 필수).
- 번들 사이즈 예산(`size-limit`) 내 통과.
- 성능 예산: LCP < 2.5s / CLS < 0.1 / INP < 200ms.
- 보안 헤더: CSP(strict + `report-uri`) · HSTS · X-Content-Type-Options · Referrer-Policy · Permissions-Policy.

---

## 개발 규칙

- **의사결정**: `karpathy-guidelines` 우선 — 단순·외과적 수정·검증 가능한 성공 기준. 단, 결제/매칭/관측성처럼 **대규모 트래픽·운영 영향**이 있는 영역에서는 확장성·유지보수성을 추가 가중치로 둔다. ADR 형태로 [.claude/wiki/decisions/](.claude/wiki/decisions/) 에 박제한다.
- **레이아웃 변경 금지**: 레이아웃(섹션 구조, 그리드, 컬럼 배치, 배경 등 시각적 구성) 수정은 **디자인 스펙이 먼저 확정된 후에만** 가능. 디자인 없이 레이아웃을 임의로 변경하지 않는다. 동작(select-none, 이벤트 핸들러 등) 수정은 레이아웃 변경이 아니므로 해당 없음.

- **TDD**: Zod 스키마 → 테스트(RED) → 구현(GREEN) → 리팩터 → 커버리지 확인.
  - 테스트는 렌더 확인 수준에 그치지 않고 **실제 사용자 플로우** 전체를 검증해야 한다: 입력 → 제출 → 성공/에러 결과 확인.
  - **유효성 검사 테스트**: 에러 메시지 텍스트뿐 아니라 에러 상태 스타일(예: `border-danger` 클래스 적용 여부), 트리거 타이밍(blur/change 시점)까지 포함.
  - **API 연동 테스트**: MSW 핸들러가 실제로 요청을 가로채는지 `waitFor` + 상태 변화로 검증. 성공·실패 케이스 모두 포함.
  - **폼 UX 테스트**: `mode`, `reValidateMode` 등 RHF 설정이 의도대로 동작하는지(초기 blur, 재입력 시 즉시 업데이트) 검증.
- **서버/클라 상태 분리**: 서버 데이터는 TanStack Query, UI/인증 토글만 Zustand.
- **API 파싱**: Axios 응답은 반드시 Zod로 파싱 후 앱 내부로 전달 (경계 검증).
- **에러 처리**: 경계(라우트/피처)마다 ErrorBoundary + Suspense. 에러 침묵 금지.
- **코드 스플리팅**: Route 단위 `React.lazy` 기본.
- **접근성**: 모든 `shared/ui/*`는 Storybook a11y addon 통과, 키보드 내비 가능.
- **민감정보 / Public Repo 안전성**: PII(닉네임·메시지 본문)는 Sentry scrubbing 필수, localStorage 에 비밀값/결제정보 저장 금지. 코드·테스트·픽스처·주석·커밋 메시지 어디에도 실제 회원 데이터·내부 URL·직원 정보·시크릿 하드코딩 금지. 자세한 차단 목록과 발견 시 프로토콜은 [§ 보안 (1급)](#보안-1급).
- **MSW**: 개발/테스트 독립성 확보 위해 유지. 백엔드 부재·장애 시 핸들러로 즉시 대응.
  - 핸들러 BASE_URL은 반드시 `import.meta.env.VITE_API_BASE_URL` 사용 — 절대 URL 하드코딩 금지. 하드코딩하면 `.env.*` 변경 시 핸들러가 요청을 가로채지 못해 실제 서버로 passthrough됨.
  - `vitest.config.ts`의 `test.env.VITE_API_BASE_URL` 값은 `.env.development`의 `VITE_API_BASE_URL`과 반드시 동기화. 새 env 변수 추가 시 두 파일 함께 수정.
  - MSW server는 `request:unhandled` 이벤트에서 에러를 throw해야 함 — 핸들러 누락·URL 불일치가 테스트 즉시 실패로 이어지도록.
- **주석**: 기본은 **주석을 쓰지 않음**. "왜"가 자명하지 않을 때만 한 줄. 코드가 하는 일을 설명하는 주석 금지.

## AI 작업물 파일 위치 규칙

- AI가 생성하는 모든 파일은 프로젝트 내 **`.claude/` 하위에만** 저장:
  - 계획/설계 → `.claude/plans/`
  - 운영 런북 → `.claude/runbook/`
  - 리서치/노트 → `.claude/notes/`
  - 서비스 개요/스펙 참조본 → `.claude/docs/` (사람이 유지하는 마스터 narrative)
  - **시스템 진실 (도메인/플로우/엔티티/API narrative/UI/ADR) → `.claude/wiki/`** (wiki-maintainer 스킬 경유 쓰기만 허용)
- 프로젝트 외부 경로(`~/.claude/plans/*` 등) 저장 금지.
- `docs/` 는 **사람이 작성**하는 공식 문서 전용 — AI가 먼저 만들지 않는다.
- AI 산출물을 공식 문서로 승격하려면 사용자가 직접 `docs/`로 이동.

## 커밋/PR

- 커밋 타입: `feat / fix / refactor / docs / test / chore / perf / ci` (Conventional Commits, 한글 요약).
- AI 커밋은 메시지 본문 말미에 `Committer: AI` trailer 필수 (사람 커밋은 trailer 미부착 — 단일 식별 기준).
- PR 본문: `git diff develop...HEAD` 전체를 근거로 요약 + 테스트 계획 체크리스트. PR base 는 **`develop`** 기본 (`main` 은 릴리즈 전용).
- AI 자동 생성 PR 은 GitHub `AI` 라벨 부착 + 본문 상단 인용 블록으로 AI 생성 명시 필수.
- `main` 보호: PR + 리뷰 1인 + 전체 CI 통과. AI 는 `main`/`develop` 에 직접 푸시 금지.
- 커밋 서명(`Co-Authored-By` 등) 자동 부여는 사용자 글로벌 설정에서 비활성화됨 — 임의 추가 금지.
- **시크릿/PII 의심 시 커밋·푸시 즉시 중단** — [§ 보안 (1급) — 발견 시 프로토콜](#보안-1급) 적용.

## AI 커밋/PR 워크플로우 트리거

사용자 발화에 아래 패턴이 감지되면 반드시 해당 스킬을 실행한다.

| 발화 패턴                                                | 실행 스킬                                             |
| -------------------------------------------------------- | ----------------------------------------------------- |
| "커밋해줘", "작업 내용을 커밋해줘", "변경사항 커밋해줘"  | `.claude/skills/commit-work/SKILL.md`                 |
| "PR 올려줘", "PR 만들어줘", "PR 생성해줘", "PR 보내줘"   | `.claude/skills/pr-code-reviewer-iterative/SKILL.md`  |
| "PR …" + 미커밋 변경이 있는 경우                         | `commit-work` → `pr-code-reviewer-iterative` 순서     |
| "wiki 정리", "wiki lint", "wiki 점검", "spec drift 봐줘" | `.claude/skills/wiki-maintainer/SKILL.md` (mode=lint) |

> 자동 INGEST 는 매 사용자 턴 첫 단계에서 avatar 가 트리거 규칙으로 판정 → 별도 발화 트리거 불필요. 사용자가 명시적으로 "이거 기억해줘", "프로젝트 결정으로 박제해줘" 라고 하면 INGEST 강제 트리거.

### 자동 진행 모드

발화에 **"자동으로 진행해"** 또는 **"자동 진행"** 이 포함되면:

- 브랜치 생성/전환 확인 생략 (자동 생성)
- 커밋 단위별 개별 승인 생략
- 세션 한정, 다음 대화로 이월 금지
- `git commit` 포함 파괴적 작업에도 적용 (시크릿 노출 의심 시 예외)
- **wiki-maintainer INGEST 사전 스캔에서 시크릿/PII 의심이 감지되면 자동 모드 즉시 해제** — CLAUDE.md 보안 1급 정책 그대로 따름.
