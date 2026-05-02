반드시 지켜야 하는 것: **자동으로 진행하라고 하면 명령어 등을 허락받지 않고 yes로 처리해 자동으로 처리할 것.**

# 아바팅(Avating) Web

데이팅 앱 형태의 **인터랙티브 관찰 예능형 소셜 게임**. 사용자의 AI 아바타를 소개팅에 매칭·관전·훈수하며 도파민을 소비한다. 결제(다이아/매칭 티켓)가 있는 실서비스이므로 **성능 유지보수 관측성·보안·배포 안정성**을 1급 관심사로 둔다.

> 세부 설정/인프라/단계별 구축 계획은 [.claude/plans/project-setup-plan.md](.claude/plans/project-setup-plan.md) 를 단일 근거로 사용한다.

---

## 서비스 요약

- **타겟**: 관계 리스크는 피하되 연애 도파민은 원하는 2030.
- **핵심 가치**: "내 AI 아바타가 대신 소개팅, 나는 관전+훈수. 리스크 0%, 본캐 연결은 선택."
- **BM**: 다이아(훈수/블라인드 해제/대기 단축) · 매칭 티켓(본캐 연결) · 프리미엄 구독(인증 배지 모아보기, 고급 필터).

## 핵심 유저 저니

1. **온보딩** — Custom GPT(연결 코드) 또는 설문으로 페르소나 분석 → 아바타 생성.
2. **매칭/세션** — 상대 아바타 선택 → 비동기 10~15턴 시뮬레이션 (드라마 인젝션으로 무작위 갈등 주입).
3. **훈수(Intervention)** — 다이아로 아바타 다음 행동/화법에 프롬프트 주입, 블라인드 텍스트 해제.
4. **본캐 연결** — 호감도 임계 초과 → 양측 동의 + 매칭 티켓 + 본인 인증 → 실제 1:1 채팅방.

## 용어 (고정)

- **회원(Member)** 실사용자 / **아바타(Avatar)** 대리 AI / **페르소나(Persona)** 성향.
- **연결 코드(Connect Code)** Custom GPT↔시스템 매핑용 1회성 코드(Valkey 임시 저장).
- **세션/턴(Session/Turn)** 대화방 / 메시지 교환 단위.
- **훈수(Intervention)** 다이아 소모 프롬프트 주입.

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

## 환경 및 배포

- **환경**: `development`(MSW 우선) / `staging` / `production`.
- **env 파싱**: `src/shared/config/env.ts`에서 Zod로 런타임 파싱 — 실패 시 앱 부팅 크래시.
- **env 노출**: 클라이언트는 `VITE_*` 접두사만. 비밀값(결제/OAuth 서명)은 **절대 프론트에 두지 않음**.
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
- **민감정보**: PII(닉네임/메시지 본문)는 Sentry scrubbing. localStorage에 비밀값/결제정보 저장 금지.
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
- 프로젝트 외부 경로(`~/.claude/plans/*` 등) 저장 금지.
- `docs/` 는 **사람이 작성**하는 공식 문서 전용 — AI가 먼저 만들지 않는다.
- AI 산출물을 공식 문서로 승격하려면 사용자가 직접 `docs/`로 이동.

## 커밋/PR

- 커밋 타입: `feat / fix / refactor / docs / test / chore / perf / ci` (Conventional Commits).
- PR 본문: `git diff main...HEAD` 전체를 근거로 요약 + 테스트 계획 체크리스트.
- `main` 보호: PR + 리뷰 1인 + 전체 CI 통과.
- 커밋 서명(`Co-Authored-By` 등) 자동 부여는 사용자 글로벌 설정에서 비활성화됨 — 임의 추가 금지.
