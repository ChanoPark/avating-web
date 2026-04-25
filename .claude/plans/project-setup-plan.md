# 아바팅(Avating) Web 프로젝트 - 기술 스택 검토 및 전체 구성 계획

## Context

`avating-web`은 현재 `CLAUDE.md`와 `.git`만 존재하는 그린필드 프로젝트입니다. `CLAUDE.md`에 비즈니스 정의, 유저 저니, 기술 스택이 정의되어 있으며, **실제 서비스 운영에 필요한 개발/유지보수/운영/모니터링을 고려한 설계**가 요구되고 있습니다.

본 문서는:
1. `CLAUDE.md`에 정의된 기술 스택의 적합성 검증
2. 로컬 개발 환경 구성 계획
3. 테스트 전략 (단위/통합/E2E/시각/접근성)
4. CI/CD 파이프라인
5. 스테이징 / 운영 인프라 구성

을 다룹니다. 아바팅은 결제(다이아/매칭 티켓)와 실사용자 매칭이 결합된 소셜 게임이므로 **관측성(Observability), 보안, 배포 안정성**을 1급 관심사로 둡니다.

---

## 1. 기술 스택 검토

### 1-1. 현재 스택 적합성 평가

| 항목 | 버전/선택 | 평가 | 비고 |
|---|---|---|---|
| React 19 | 최신 stable | 적합 | Server Components는 SPA에선 미사용 |
| TypeScript 5 | 현행 major | 적합 | `strict: true` 전제 |
| Vite 6 | 현행 major | 적합 | 2026-04 기준 Vite 7도 가용 — 초기 안정성 위해 6 유지 권장 |
| Tailwind CSS 4 | v4 신 아키텍처 | 적합 | Lightning CSS 기반, PostCSS 설정 방식이 v3와 상이함에 유의 |
| Motion | `motion/react` | 적합 | Framer Motion 리브랜드. 번들 tree-shaking 지원 |
| Axios | HTTP | 조건부 | 인터셉터/토큰 갱신 용도면 유지. 단순 GET/POST만이면 fetch + ky도 고려 |
| TanStack Query v5 | 서버 상태 | 적합 | 필수 |
| Zod | 스키마 검증 | 적합 | API 응답 파싱에도 사용 권장 |
| React Hook Form | 폼 상태 | 적합 | `@hookform/resolvers/zod` 세트 |
| MSW | API 모킹 | **유지 권장** | "혼자라 필요 없다"고 하셨지만, 백엔드 장애/미완성 API에 대한 **개발 독립성**과 **테스트 안정성** 때문에 필수 |
| Zustand | 클라이언트 상태 | 적합 | 인증/UI 상태만. 서버 상태는 TanStack Query로 |
| React Router v7 | 라우팅 | 적합 | **library mode (SPA)** 로 사용 — CloudFront/S3 정적 호스팅과 정합 |
| React Suspense / ErrorBoundary | 로딩/에러 | 적합 | `react-error-boundary` 라이브러리로 보강 권장 |
| Lucide React | 아이콘 | 적합 | Tree-shaking 가능 |
| AWS CloudFront/S3 | 배포 | 적합 | OAC(Origin Access Control) 권장, OAI는 legacy |
| Storybook | 카탈로그 | 적합 | v8+ |
| Vitest + RTL | 테스트 | 적합 | 필수 |

### 1-2. 누락되어 추가가 필요한 항목

운영 서비스를 가정할 때 **필수 추가** 항목:

**코드 품질 / DX**
- **pnpm** (패키지 매니저): 속도/디스크 효율성. `corepack`으로 버전 고정
- **Node.js 22 LTS** + `.nvmrc` / Volta로 버전 고정
- **ESLint 9** (flat config) + `typescript-eslint` + `eslint-plugin-react` + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y` + `eslint-plugin-tailwindcss`
- **Prettier 3** + `prettier-plugin-tailwindcss`
- **Husky** + **lint-staged** + **commitlint** (Conventional Commits 강제)
- **Knip** (미사용 코드/의존성 탐지), **vite-bundle-visualizer** (번들 분석)

**테스트**
- **Playwright**: E2E (사용자 전역 규칙에서 필수)
- **@axe-core/playwright**, **@storybook/addon-a11y**: 접근성
- **Lighthouse CI**: 성능 회귀 방지
- **Storybook test-runner**: 스토리 기반 스모크 테스트

**관측성 / 운영**
- **Sentry**: JS 에러 + Performance(Web Vitals) + 소스맵 업로드 + Release 트래킹
- **Amplitude**: 제품 분석(가입/매칭/개입/결제 퍼널, 리텐션/코호트). 결제 BM이 있는 서비스는 필수
- **ELK** (백엔드/인프라가 구성): 운영 로그/보안 감사/인프라 이상 탐지용. **웹 RUM/퍼널 분석과 역할이 다름** — 웹 클라이언트 이벤트는 Amplitude, 서버/인프라 로그는 ELK로 역할 분리. 필요 시 Amplitude → S3 → Logstash로 연동도 가능
- **AWS CloudWatch RUM** 또는 **Datadog RUM** (선택): 실사용자 성능 모니터링
- **UptimeRobot / Better Stack**: 외부 가용성 감시

**인프라 / 보안**
- **Terraform**: IaC — 사용자의 기존 숙련도와 백엔드/인프라 표준을 따름. 웹 스택(`infra/terraform/`)을 모듈화해 staging/production을 workspace 또는 tfvars로 분리. 상태는 S3 백엔드 + DynamoDB lock
- **AWS WAF**: Bot/DDoS/Rate limit
- **AWS ACM**: TLS
- **AWS Secrets Manager / SSM Parameter Store**: 빌드타임 secret 주입
- **GitHub OIDC → AWS IAM Role**: CI에서 장기 액세스 키 제거
- **Renovate** 또는 **Dependabot**: 의존성 자동 업데이트

**비즈니스 요구에서 파생되는 추가 후보**
- **소셜 로그인**: Kakao / Naver / Apple / Google (한국 2030 타겟)
- **결제 SDK**: 토스페이먼츠 / 포트원(아임포트) — 다이아/매칭 티켓 결제 웹뷰 대응
- **GrowthBook** (OSS, self-host 가능): 피처 플래그 + A/B 실험. "드라마 인젝션" 실험, 훈수 가격 테스트, 단계적 롤아웃에 활용. 초기엔 GrowthBook Cloud 무료 티어로 시작하고 트래픽 증가 시 EC2/ECS에 self-host 전환 (Terraform 모듈로 관리)
- **react-i18next**: 해외 확장 대비 (초기엔 ko만 번들)
- **date-fns** 또는 **dayjs**: 시간 표시 (턴 간 경과 시간 등)

### 1-3. `CLAUDE.md`에 반영할 스택 수정 제안

현재 평문 나열된 기술 스택을 **카테고리 구조**로 재정리하고 누락 항목을 추가하는 수정이 필요합니다. 최종 작업 시 `CLAUDE.md`의 "# 기술 스택" 섹션을 다음과 같은 구조로 교체:
- 언어/런타임, 프레임워크, UI/스타일링, 상태 관리, 데이터/검증, 라우팅, 테스트, 품질/린트, 관측성, 인프라/배포, 보안, 도구

---

## 2. 프로젝트 스캐폴딩 계획

### 2-1. 디렉터리 구조 (Feature-Sliced 경량 적용)

```
avating-web/
├── .github/workflows/        # CI/CD (ci.yml, deploy-staging.yml, deploy-production.yml)
├── .husky/                   # pre-commit, commit-msg
├── .storybook/
├── infra/terraform/          # Terraform (S3 backend + DynamoDB lock)
│   ├── modules/
│   │   ├── cloudfront-s3/    # 재사용 가능한 정적 호스팅 모듈
│   │   ├── waf/
│   │   └── monitoring/
│   ├── envs/
│   │   ├── staging/          # backend.tf, main.tf, terraform.tfvars
│   │   └── production/
│   └── global/               # Route53 zone, ACM (us-east-1) 등 공통
├── public/
├── src/
│   ├── app/                  # 앱 최상위: Providers, Router, ErrorBoundary
│   │   ├── providers/        # QueryClient, Sentry, Router 등
│   │   └── router.tsx
│   ├── pages/                # 라우트 레벨 페이지
│   │   ├── onboarding/
│   │   ├── matching/
│   │   ├── session/
│   │   └── settings/
│   ├── features/             # 기능 단위 (UI + 훅 + API + 상태)
│   │   ├── auth/
│   │   ├── connect-code/     # Custom GPT 연동
│   │   ├── persona-survey/
│   │   ├── avatar/
│   │   ├── matching/
│   │   ├── session-chat/
│   │   ├── intervention/     # 훈수 (다이아 결제)
│   │   ├── blind-reveal/     # 블라인드 해제
│   │   ├── real-connection/  # 본캐 연결
│   │   └── payment/          # 다이아/티켓 결제
│   ├── entities/             # 도메인 모델 + zod 스키마
│   │   ├── member/
│   │   ├── avatar/
│   │   ├── persona/
│   │   └── session/
│   ├── shared/
│   │   ├── ui/               # 디자인 시스템 (Button, Dialog ...) + Storybook
│   │   ├── hooks/
│   │   ├── lib/              # axios instance, queryClient, sentry, analytics
│   │   ├── config/           # env, routes, feature flags
│   │   └── utils/
│   ├── mocks/                # MSW handlers + factories
│   ├── test/                 # test setup, RTL utils, fixtures
│   └── main.tsx
├── tests/
│   └── e2e/                  # Playwright
│       ├── fixtures/
│       └── specs/
├── .env.example
├── .env.development
├── .env.staging
├── .env.production
├── .nvmrc
├── .eslint.config.mjs
├── .prettierrc
├── commitlint.config.js
├── tailwind.config.ts
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── tsconfig.json
```

### 2-2. 핵심 설정 원칙

- **경로 별칭**: `@/` → `src/`, `@shared/`, `@features/`, `@entities/`, `@pages/` (tsconfig + vite + vitest 공통)
- **tsconfig**: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride` 모두 활성화
- **ESLint**: `max-warnings=0` (CI fail), 순환 의존성 감지(`import/no-cycle`), 레이어 간 의존 방향 강제(`eslint-plugin-boundaries` — entities → shared, features → entities/shared, pages → features, app → pages)
- **환경 변수**: `VITE_` 접두사만 클라이언트 노출. 모든 env는 Zod로 런타임 파싱(`src/shared/config/env.ts`)해 앱 부팅 실패를 빠르게 만듦
- **코드 스플리팅**: `React.lazy` + Route-level 분할, `@loadable/component`는 불필요 (RR v7이 처리)

---

## 3. 로컬 개발 환경 구성

### 3-1. 개발 서버 구동

```
pnpm install
pnpm dev              # Vite dev, API는 MSW로 모킹
pnpm dev:staging-api  # MSW 끄고 스테이징 API에 붙어 테스트
pnpm storybook
```

- Vite dev에서 `VITE_API_MODE=mock | staging | production` 으로 전환
- MSW는 `src/mocks/browser.ts`에서 dev 환경에서만 조건부 시작
- HTTPS 로컬 (`@vitejs/plugin-basic-ssl` 또는 `mkcert`) — Custom GPT Webhook 개발 시 유용

### 3-2. Git 훅

- **pre-commit**: `lint-staged` → ESLint + Prettier + `tsc --noEmit` (변경 파일 범위)
- **commit-msg**: commitlint (feat/fix/refactor/docs/test/chore/perf/ci 타입만 허용)
- **pre-push**: `pnpm test:related` (변경에 영향 받는 테스트만)

### 3-3. 개발 단계 테스트 방법

| 층위 | 도구 | 언제 | 대상 |
|---|---|---|---|
| **타입** | `tsc --noEmit` | 저장/커밋/CI | 전 코드 |
| **단위** | Vitest + RTL | 기능 작성 직후 | 순수 함수, 훅, 작은 컴포넌트 |
| **통합** | Vitest + MSW | 기능 단위 완료 | 페이지/피처 + API 연동 |
| **시각** | Storybook | 컴포넌트 추가 | `shared/ui/*`, feature 주요 뷰 |
| **접근성** | `@storybook/addon-a11y`, `@axe-core/playwright` | Storybook + E2E | 모든 라우트 |
| **E2E** | Playwright | 중요 플로우 | 온보딩, 매칭, 세션, 결제 |
| **성능** | Lighthouse CI | PR | 주요 라우트 |
| **번들 사이즈** | `size-limit` | PR | 초기 bundle, route chunk |

#### TDD 워크플로 (사용자 전역 규칙 준수)
1. Zod 스키마 + 타입 먼저 작성 → 2. Vitest/RTL 테스트 작성 (RED) → 3. 구현 (GREEN) → 4. 리팩터 → 5. 커버리지 80%+ 확인 (`vitest --coverage`, v8 provider)

#### E2E 핵심 시나리오 (Playwright)
- **온보딩**: 설문 완료 → 아바타 생성 성공
- **연결 코드 발급**: Connect Code 생성 → 복사 UI 동작
- **매칭**: 아바타 탐색 → 매칭 요청 → 대기 상태
- **세션 관전**: 세션 진입 → 메시지 스트리밍 표시 → 호감도 UI 업데이트
- **훈수**: 다이아 차감 → 프롬프트 주입 → 아바타 응답 반영
- **본캐 연결**: 호감도 임계치 → 동의 팝업 → 실제 채팅방 개설 플로우(성공 경로)
- **결제 실패/네트워크 오류**: ErrorBoundary + Toast 확인

Playwright는 `chromium`을 기본으로, CI에선 `chromium + webkit` 매트릭스 실행 (iOS Safari 호환성 확보 — 2030 타겟은 모바일 웹뷰 비중 높음).

---

## 4. CI/CD 파이프라인

### 4-1. CI (모든 PR)

**`.github/workflows/ci.yml`** — 모든 PR에서 실행, 병렬 job:

1. **setup**: pnpm install (캐시), Node 22
2. **lint**: `pnpm lint` (ESLint max-warnings=0)
3. **typecheck**: `tsc --noEmit`
4. **format**: `prettier --check`
5. **test**: `vitest run --coverage` (커버리지 80% 미만이면 fail, Codecov 업로드)
6. **build**: `vite build` (staging env)
7. **storybook-build**: 빌드 성공 확인
8. **e2e**: Playwright (chromium + webkit), 빌드 결과를 HTTP 서빙
9. **lighthouse**: Lighthouse CI (budget 위반 시 warning)
10. **bundle-size**: `size-limit` (limit 초과 시 fail)
11. **security**: `pnpm audit --prod` + OSV-Scanner

모든 job이 green일 때만 머지 허용 (branch protection).

### 4-2. CD — 스테이징 (main merge 시)

**`.github/workflows/deploy-staging.yml`**:

1. GitHub OIDC로 AWS IAM Role Assume
2. `pnpm build` (`.env.staging` 주입, `VITE_SENTRY_ENV=staging`)
3. Sentry CLI: 릴리스 생성 + 소스맵 업로드 + deploy 마킹
4. S3 sync (`s3://avating-web-staging/`) — immutable asset은 `Cache-Control: public, max-age=31536000, immutable`, `index.html`만 `no-cache`
5. CloudFront invalidation: `/index.html` + `/` (asset은 content hash로 자동 갱신)
6. Playwright 스모크 스위트를 `https://staging.avating.com`에 실행
7. 실패 시 이전 S3 버전으로 롤백 (객체 버전닝 활용)
8. Slack 알림

### 4-3. CD — 운영 (Git tag `v*.*.*`)

**`.github/workflows/deploy-production.yml`**:

1. **Manual approval** (GitHub Environments: `production`)
2. 빌드 (`.env.production`, `VITE_SENTRY_ENV=production`, 소스맵은 Sentry에만 업로드하고 S3에는 **업로드 안 함**)
3. S3 sync (`s3://avating-web-production/`)
4. CloudFront invalidation
5. **Canary**: CloudFront 함수로 일부 트래픽을 신규 버전으로 유도 (선택적, v2 이후 고도화)
6. Post-deploy Playwright 스모크 (프로덕션 Read-only 시나리오만)
7. Sentry Release `deploy --env production`
8. Rollback 절차 문서화: S3 object version revert + CloudFront invalidate, 5분 이내 복구 목표

---

## 5. 스테이징 서버 구성

### 5-1. 목적
- `main` 브랜치 최신 상태를 **운영과 동일한 아키텍처**로 상시 배포
- QA, PM, 디자이너 검증 환경
- E2E 회귀 테스트 타겟

### 5-2. AWS 구성 (Terraform으로 관리)

```
Route53 (staging.avating.com)
   └── ACM cert (us-east-1)
   └── CloudFront Distribution (staging)
         ├── Origin: S3 bucket (private, OAC)
         ├── Default behavior: cache index.html=0, asset=1y immutable
         ├── Response Headers Policy (CSP, HSTS, X-Frame-Options, Referrer-Policy)
         ├── CloudFront Function: SPA fallback (404 → /index.html)
         ├── AWS WAF WebACL (rate limit 100 req/5min/IP, AWSManagedRulesCommonRuleSet)
         └── Logs → S3 logs bucket (30일 보관)
```

- **S3 버킷**: `avating-web-staging`, 퍼블릭 접근 차단, OAC로만 CloudFront 접근, 객체 버전닝 ON
- **도메인**: `staging.avating.com`
- **환경 변수**:
  - `VITE_API_BASE_URL=https://api-staging.avating.com`
  - `VITE_SENTRY_DSN=...` (staging DSN)
  - `VITE_SENTRY_ENV=staging`
  - `VITE_AMPLITUDE_KEY=...` (staging project)
  - `VITE_FEATURE_FLAG_KEY=...` (staging)
- **Basic Auth**: CloudFront Function으로 간단한 Basic Auth 적용 (외부 노출 최소화)
- **모의 결제**: 토스페이먼츠/포트원 테스트 키 사용

### 5-3. 운영 차이점 체크리스트
- 결제: 테스트 키
- 푸시/알림: 내부 테스트 채널만
- 분석/Sentry: `environment=staging` 태그 — 대시보드 분리
- robots.txt: `Disallow: /` (검색 노출 방지)

---

## 6. 운영 서버 구성

### 6-1. AWS 구성 (Terraform, 스테이징과 모듈 공유 `modules/cloudfront-s3`)

```
Route53 (avating.com + www)
   └── ACM cert (us-east-1)
   └── CloudFront Distribution (production)
         ├── Origin: S3 (private, OAC, 객체 버전닝 ON)
         ├── Origin Shield: ICN (Seoul) — 한국 타겟 캐시 히트율 개선
         ├── Price Class: PriceClass_200 (아시아+북미, 유럽 제외로 비용 최적화)
         ├── HTTP/3 + HTTP/2 활성화
         ├── Compression ON (Brotli)
         ├── Response Headers Policy
         │    ├── CSP (strict: script-src 'self' + nonce, 외부 도메인 화이트리스트)
         │    ├── HSTS (max-age=63072000, includeSubDomains, preload)
         │    ├── X-Content-Type-Options: nosniff
         │    ├── Referrer-Policy: strict-origin-when-cross-origin
         │    └── Permissions-Policy (카메라/마이크/지오 제한)
         ├── CloudFront Function: SPA fallback, www→apex redirect
         ├── AWS WAF
         │    ├── AWSManagedRulesCommonRuleSet
         │    ├── AWSManagedRulesKnownBadInputsRuleSet
         │    ├── AWSManagedRulesAmazonIpReputationList
         │    ├── Rate limit: 1000 req / 5min / IP
         │    └── Geo block: 필요 시 (초기엔 off)
         ├── Real-time logs → Kinesis → CloudWatch / Datadog (선택)
         └── Access Logs → S3 (90일 보관, Athena로 쿼리)
```

- **도메인**: `avating.com` (apex) + `www.avating.com` 리다이렉트
- **S3**: `avating-web-production`, 객체 버전닝 **필수** (즉시 롤백을 위해)
- **환경 변수**: 프로덕션 Sentry DSN, Amplitude key, API base URL, 포트원/토스 라이브 키
- **배포 전략**: 정적 자산 배포이므로 blue/green 불필요 — S3 객체 버전닝 + CloudFront invalidation으로 Atomic 교체
- **Rollback**: `aws s3api list-object-versions` → 이전 버전 restore → invalidate. 런북(`.claude/runbook-rollback.md`) 작성

### 6-2. 관측성 (Observability)

| 목적 | 도구 | 상세 |
|---|---|---|
| 에러 추적 | Sentry | JS errors, unhandled rejections, ErrorBoundary captures, Source maps |
| 성능 (RUM) | Sentry Performance or CloudWatch RUM | LCP/FID/CLS/INP, Long tasks, Route transitions |
| 제품 분석 | Amplitude | 가입, 아바타 생성, 매칭, 훈수, 블라인드 해제, 본캐 연결, 결제 퍼널 |
| 운영/보안 로그 | **ELK** (백엔드/인프라 공용) | CloudFront access log, Lambda@Edge log, WAF log를 Logstash → ES 전송. Kibana 대시보드로 5xx/WAF 차단/지역별 트래픽 모니터링 |
| 피처 실험 | GrowthBook | 플래그 노출/전환율, A/B 결과. Amplitude와 user_id 연동 |
| 가용성 | Better Stack | `/`, `/health`(index.html), 1분 주기 |
| 합성 모니터링 | CloudWatch Synthetics | 주요 플로우 10분 주기 |
| 비용 | AWS Cost Explorer + Budget alarm | 월 예산 대비 80% 초과 시 알림 |

**Sentry 규칙**:
- 모든 Release에 커밋 SHA + 버전 태그
- Source map은 Sentry에만 업로드, S3엔 `.map` 파일 업로드 금지 (소스 유출 방지)
- PII scrubbing 활성화 (닉네임/메시지 본문 마스킹)

**Amplitude 이벤트 택소노미** (초기):
- `member_signed_up`, `persona_survey_completed`, `connect_code_issued`, `connect_code_claimed`, `avatar_created`, `match_requested`, `match_started`, `session_turn_viewed`, `intervention_used { diamond_cost }`, `blind_revealed { diamond_cost }`, `real_connection_offered`, `real_connection_accepted`, `ticket_purchased { amount }`

### 6-3. 보안 운영

- **CSP**: strict. `report-uri`로 Sentry에 위반 보고
- **Secrets**: `VITE_*` 외 secret을 클라이언트에 두지 않음. OAuth/결제 서명은 백엔드 위임
- **Dependency**: Renovate 주 1회 PR, Dependabot security alerts
- **CVE 대응**: `pnpm audit` critical/high는 48시간 내 패치 SLA
- **GitHub Secrets**: 환경별 분리(`production` / `staging` environments), OIDC만 사용, 장기 키 금지
- **Branch protection**: `main`은 PR + 리뷰 1인 + CI pass + 대화 해결 강제
- **개인정보**: 결제/본인인증 데이터는 백엔드 책임. 웹은 민감정보 로그/localStorage 저장 금지

### 6-4. 운영 런북

`.claude/runbook/` 에 작성:
- `incident-response.md`: Sentry alert → triage → 롤백 결정 트리
- `rollback.md`: S3 버전 롤백 절차
- `deploy.md`: 수동 배포(긴급 패치) 절차
- `onboarding.md`: 신규 개발자 온보딩
- `cloudfront-cache.md`: 캐시 전략/Invalidation 규칙

---

## 7. 실행 단계 (Phased Rollout)

실제 구축은 다음 순서로 진행 권장 (각 단계가 이전 단계 기반):

**Phase 0: 스캐폴딩 (1-2일)**
- Vite + React 19 + TS 5 초기화 (`pnpm create vite`)
- 디렉터리 구조 생성, tsconfig/ESLint/Prettier/Husky/commitlint
- Tailwind 4 설정
- `.env.*` 구조, Zod env 파서
- 기본 Provider 구성 (QueryClient, Router, ErrorBoundary, Suspense)

**Phase 1: 개발 표준 (2-3일)**
- Vitest + RTL + MSW 통합, 예시 테스트
- Storybook 8 + a11y addon
- Playwright 뼈대 + 1개 smoke test
- GitHub Actions CI 완성

**Phase 2: 도메인 기반 스켈레톤 (3-5일)**
- `entities/*` Zod 스키마 (Member, Avatar, Persona, Session)
- `shared/ui` 기본 컴포넌트 (Button, Dialog, Input) + 스토리 + 테스트
- axios 인스턴스 + 인터셉터 + Zod 응답 파서
- Sentry, Amplitude 초기화 래퍼

**Phase 3: 인프라 IaC (2-3일)**
- Terraform 프로젝트 (`infra/terraform/`) — S3 remote state + DynamoDB lock 초기화
- `modules/cloudfront-s3`, `modules/waf`, `modules/monitoring` 작성
- `envs/staging` 적용 → 스테이징 배포 (Route53/ACM/S3/CloudFront/WAF)
- Deploy-staging workflow 완성 → 최초 배포 검증
- `envs/production` 정의 (도메인 전환은 이후 phase)
- GitHub OIDC → IAM Role Terraform으로 프로비저닝

**Phase 4: 기능 구현 (제품 로드맵 대로)**
- 온보딩 → 매칭 → 세션 → 개입 → 본캐 연결 → 결제 순

**Phase 5: 운영 런칭 준비**
- Lighthouse 예산 설정, 성능 튜닝
- 런북 문서화
- Production 도메인 전환, 모니터링 알람 최종 설정
- 보안 점검 (CSP, WAF, dependency audit)

---

## 8. 수정 대상 파일 (실행 시)

본 계획 승인 후 생성/수정할 주요 파일:

- `CLAUDE.md` — 기술 스택 섹션 재구조화 + 누락 항목 추가 (§1-3 참고)
- `package.json` — 의존성, scripts
- `pnpm-workspace.yaml` (모노레포 가능성 대비, 초기엔 단일 패키지)
- `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`
- `.eslint.config.mjs`, `.prettierrc`, `commitlint.config.js`, `.nvmrc`
- `tailwind.config.ts`
- `.github/workflows/ci.yml`, `deploy-staging.yml`, `deploy-production.yml`
- `.husky/pre-commit`, `.husky/commit-msg`
- `src/app/*`, `src/shared/config/env.ts`, `src/shared/lib/sentry.ts`, `src/shared/lib/analytics.ts`, `src/shared/lib/queryClient.ts`, `src/shared/lib/axios.ts`
- `infra/terraform/` (modules/ + envs/staging + envs/production + global/)
- `.claude/runbook/*`

---

## 9. 검증 방법 (End-to-End)

각 단계 완료 시 다음으로 검증:

1. **로컬**: `pnpm dev` → MSW로 온보딩 모킹 → 브라우저에서 동작 확인
2. **테스트**: `pnpm test` (80%+ 커버리지), `pnpm e2e` (Playwright), `pnpm storybook:test`
3. **빌드**: `pnpm build && pnpm preview` → 번들 사이즈 예산 내 확인
4. **CI**: PR 올려 모든 job green 확인
5. **스테이징 배포**: main 머지 후 `staging.avating.com`에서 Playwright 스모크 자동 실행
6. **관측성**: Sentry dashboard에 빌드 release 표시, Amplitude에 이벤트 수집 확인
7. **성능**: Lighthouse CI 리포트에서 LCP < 2.5s, CLS < 0.1, INP < 200ms
8. **보안**: `securityheaders.com` A+ 등급, `observatory.mozilla.org` A 이상
9. **운영 배포**: tag push → 승인 → 배포 → 합성 모니터링 정상 확인
10. **롤백 훈련**: 스테이징에서 분기별 롤백 드릴 수행

---

## 10. 확정된 주요 결정 사항

사용자 확인을 거쳐 다음과 같이 확정:

1. **React Router v7**: **Library 모드 (SPA)** — CloudFront/S3 정적 호스팅과 정합
2. **IaC**: **Terraform** — 사용자 숙련도 + 백엔드/인프라 표준 일치. S3 backend + DynamoDB lock
3. **제품 분석**: **Amplitude** (웹 퍼널/리텐션) + **ELK** (운영/보안 로그) — 역할 분리
4. **피처 플래그**: **GrowthBook 초기 도입** — Cloud 무료 티어로 시작, 추후 self-host 전환
