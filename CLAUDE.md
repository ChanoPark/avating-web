# 아바팅(Avating) Web

AI 아바타끼리 소개팅 시뮬레이션을 하고, 결과에 만족한 양측의 **코치**(실제 사용자)가 실제 소개팅까지 이어지는 서비스. 실사용자 매칭이 작동하는 실서비스이므로 성능·관측성·보안·배포 안정성을 항상 우선한다.

도메인 용어는 [wiki/domains/glossary.md](.claude/wiki/domains/glossary.md) 에 정리돼 있다. 여기 없는 말을 새로 만들지 않는다.

> **용어 정정 (2026-07-26)**: 실제 사용자를 가리키는 말은 **코치**다. wiki 와 `.claude/docs/` 여러 곳에 남아 있는 "본캐"는 쓰지 않는 표현이므로 순차 정정 대상이다.

## 작업 전에 어디를 보나

| 알고 싶은 것                                                   | 볼 곳                                                                                         |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 지금 코드가 무엇을 하고 있나 (도메인·플로우·엔티티·API·UI·ADR) | [.claude/wiki/index.md](.claude/wiki/index.md) — sub-agent 는 작업 직전 wiki-maintainer QUERY |
| 앞으로 어떻게 할 것인가 (사람이 검수한 기능 명세)              | `docs/spec/`, `.claude/docs/`                                                                 |
| 스택별 규칙과 안티패턴                                         | [.claude/skills/README.md](.claude/skills/README.md) — 해당 영역 수정 전                      |

---

## 코드를 판단하는 기준

과설계를 피하고, 고칠 곳만 외과적으로 고치고, 가정을 드러내고, 확인 가능한 완료 기준을 세운다. [karpathy-guidelines](.claude/skills/karpathy-guidelines/SKILL.md) 가 코드를 쓰고 고치고 리뷰하는 모든 순간의 기준선이다.

예외는 wiki 와 컨텍스트 인프라 작업뿐이다. 이 영역에서는 일관성과 토큰 효율이 단순함보다 앞선다(ADR-001 § 5). 기능 코드는 기준선 그대로다.

---

## 아키텍처

불변성, Zod 경계 파싱, 상태 분리, 에러 경계, 민감정보, 접근성, 주석 같은 공통 규율은 [skills/README.md 의 규율 절](.claude/skills/README.md)과 각 SKILL.md 에 있다. 여기엔 이 프로젝트에만 해당하는 값만 둔다.

- **진입점**: `src/main.tsx` → `src/app/App.tsx` → `src/app/router.tsx`
- **레이어 방향**: `app → pages → features → entities → shared`. 역방향과 동일 층 의존은 `eslint-plugin-boundaries` 가 막는다.
- **레이어별 디렉터리**:
  - `app/` — providers · layouts · styles · router
  - `pages/` — login · signup · onboarding · dashboard · avatar-detail · service-intro · error
  - `features/` — auth · onboarding-complete · persona-survey · connect-code · dashboard · match-request · avatar-profile
  - `entities/` — auth · avatar · onboarding · dashboard · inbox · match-request (각 `model.ts` 의 Zod 가 타입의 출발점)
  - `shared/` — ui · api · lib · config · mocks
- **MSW 는 `src/shared/mocks/`** 에 있다 (`browser.ts` · `server.ts` · `handlers/<domain>.ts`). `src/mocks/` 는 옛 경로다. 이 위치가 문서에 없던 탓에 `knip.config.ts` 와 `vitest.config.ts` 가 한동안 죽은 경로를 들고 있었다.
- **경로 별칭**: `@/`(src), `@app/`, `@pages/`, `@features/`, `@entities/`, `@shared/` — `tsconfig.app.json`, `tsconfig.e2e.json`, `vite.config.ts`, `vitest.config.ts` 네 곳이 같이 움직인다.
- **레이아웃은 디자인 확정 후에만** 손댄다. 섹션 구조·그리드·컬럼·배경 등 시각 구성이 대상이고, 이벤트 핸들러나 `select-none` 같은 동작 수정은 해당 없다.

---

## 자주 쓰는 명령어

패키지 매니저는 `pnpm` 고정. 프로젝트 루트에서 실행하고, 처음이면 `pnpm install` 부터.

| 영역             | 명령                                                                      | 비고                                               |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| 개발 서버        | `pnpm dev`                                                                | Vite + MSW                                         |
| 타입 체크        | `pnpm typecheck`                                                          | `tsc -b --noEmit`                                  |
| 빌드             | `pnpm build`                                                              | typecheck → vite build                             |
| 린트             | `pnpm lint` / `pnpm lint:fix`                                             | `--max-warnings=0`                                 |
| 포맷             | `pnpm format` / `pnpm format:check`                                       | Prettier 3                                         |
| 단위·통합 테스트 | `pnpm test` / `pnpm test:watch`                                           | Vitest + RTL, `src/**` 만 수집                     |
| 커버리지         | `pnpm test:coverage`                                                      | v8, lines·functions·branches·statements 각 80%     |
| E2E              | `pnpm e2e`                                                                | `test:e2e` 가 아니다. Playwright chromium + webkit |
| E2E 부가         | `pnpm e2e:ui` · `e2e:headed` · `e2e:report` · `e2e:install` · `e2e:build` | `e2e:build` 는 mock 번들                           |
| E2E 타입체크     | `pnpm typecheck:e2e`                                                      | `tsconfig.e2e.json`                                |
| 화면 코드맵      | `pnpm wiki:codemap` / `:check`                                            | `wiki/screens/` 의 codemap 마커                    |
| 스크립트 테스트  | `pnpm test:scripts`                                                       | `node --test scripts/**`                           |
| 프리뷰           | `pnpm preview`                                                            | 포트 4173                                          |

의존성 추가는 사용자 승인을 받고 `pnpm add`. `--no-verify` 로 훅을 넘기지 않는다.

---

## 환경과 MSW — 자주 사고 나는 곳

- **env 파싱**: `src/shared/config/env.ts` 가 Zod 로 런타임 검증한다. 실패하면 부팅이 크래시한다. 클라이언트에 노출되는 건 `VITE_*` 뿐이고, OAuth 서명 같은 비밀값은 프론트에 두지 않는다.
- **MSW BASE_URL**: 핸들러에서 `import.meta.env.VITE_API_BASE_URL` 을 쓴다. URL 을 하드코딩하면 `.env.*` 를 바꾸는 순간 passthrough 사고가 난다.
- **env 파일이 3벌**: `vitest.config.ts` 가 `loadEnv(mode, …, 'VITE_')` 로 자동 로드하므로 config 안에 값을 적는 자리가 없다. 테스트는 mode=test 라 `.env.test` 를, 개발은 `.env.development` 를 읽고, 커밋되는 건 키만 담긴 `.env.example` 이다. 새 `VITE_*` 를 추가하면 세 파일을 같이 고쳐야 한다. `.env.development` 만 고치면 테스트에는 반영되지 않는다.
- **MSW unhandled**: server 는 `request:unhandled` 에서 throw 한다. 핸들러가 없거나 URL 이 어긋나면 테스트가 바로 실패한다.

---

## TDD 와 품질 게이트

- 순서는 Zod 스키마 → 실패하는 테스트(RED) → 구현(GREEN) → 리팩터 → 커버리지 확인.
- 테스트는 실제 사용자 플로우를 본다. 입력 → 제출 → 성공/에러까지 가고, 에러 상태 스타일(`border-danger` 등)과 트리거 타이밍(blur/change), MSW 가로채기 후 상태 변화(`waitFor`)를 확인한다. 렌더만 확인하고 끝내지 않는다.
- `tsc --noEmit` strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride`.
- ESLint `--max-warnings=0`, Prettier `--check`, Vitest 커버리지 80% 이상.
- Playwright 는 chromium 과 webkit 둘 다 (iOS Safari 호환 확인용).
- 성능 목표는 LCP 2.5s · CLS 0.1 · INP 200ms 미만인데, **재는 도구가 없다.** `size-limit` 과 Lighthouse CI 둘 다 설치돼 있지 않다(2026-07-26 확인). 도입 전까지 성능과 번들 크기는 눈으로 판단한다.
- pre-commit 훅은 `lint-staged` → `pnpm typecheck` → `pnpm exec knip` 순으로 돌고 knip 에서 걸리면 커밋이 막힌다. `commit-msg` 와 `pre-push` 훅은 없어서 **커밋 메시지 형식은 도구가 검사하지 않는다.**

안티패턴과 세부 체크리스트는 각 [SKILL.md](.claude/skills/README.md) 에 있다.

---

## wiki 와 docs (ADR-001)

`.claude/wiki/` 는 지금 코드가 어떤 상태인지 적어둔 곳이다. AI 가 가장 먼저 읽는 컨텍스트고, 새 세션이 매번 `src/` 를 처음부터 훑지 않아도 되게 해준다. `docs/spec/` 과 `.claude/docs/` 는 반대로 앞으로의 방향을 담은 사람 검수 문서다.

wiki 쓰기는 [wiki-maintainer 스킬](.claude/skills/wiki-maintainer/SKILL.md) 을 거쳐야 한다. 훅 두 개(`wiki-write-gate.sh` 가 Edit/Write, `wiki-bash-gate.sh` 가 Bash)가 토큰 없는 편집·이동·삭제를 실제로 막는다. INGEST / UPDATE / LINT / QUERY 네 모드의 트리거와 절차는 스킬 § 1 에 있다.

충돌하면:

- 구현된 사실은 wiki 를, 앞으로의 결정은 docs 를 따른다.
- 양쪽이 모순되면 AI 가 임의로 봉합하지 않는다.
- INGEST 중 docs 와 어긋나거나 빠진 게 보이면 `spec-divergence` 나 `spec-gap` 을 보고에 달고 사용자에게 docs 갱신을 요청한다. **AI 는 `docs/spec/` 를 직접 쓰거나 고치지 않는다.**
- 사용자가 새 기능 플로우를 설명하면 구현 전에 `docs/spec/<feature>.md` 작성을 요청한다.

---

## AI 가 만든 파일은 어디에

- 전부 프로젝트 안 `.claude/` 아래에 둔다. 계획과 설계는 `.claude/plans/`, 리서치 노트는 `.claude/notes/`.
- 계획이 끝나면 `.claude/deprecated/plans/` 로 옮긴다. status 규칙은 [.claude/plans/README.md](.claude/plans/README.md) 에 있다.
- `~/.claude/*` 같은 프로젝트 밖 경로에는 저장하지 않는다.
- `docs/` 와 `.claude/docs/` 는 사람 전용이라 읽기만 한다. AI 산출물을 정식 문서로 올리려면 사용자가 직접 옮긴다.
- 새 문서를 만들기 전에 같은 주제의 기존 문서를 먼저 찾는다. 있으면 갱신하고, 굳이 새로 쓴다면 이유를 상단에 적는다. `.claude/` 는 gitignore 대상이라 삭제하면 되돌릴 수 없으니 정리는 이동으로만 한다.

---

## 커밋과 PR

브랜치 규칙, PR 리뷰 게이트, 커밋 전 diff 리뷰, API 계약 검사는 **훅이 실제로 막는다** — 문서를 읽지 않아도 걸린다. 정책 본문은 [git-flow-public-repo](.claude/skills/git-flow-public-repo/SKILL.md) 에 있고, 커밋 타입 목록도 그쪽 § 2.2 에 있다(여기 옮겨 적으면 어긋난다 — 실제로 8개 대 11개로 갈렸던 적이 있다).

훅이 잡지 못해서 지켜야 하는 것들:

- **AI 는 커밋을 자동으로 하지 않는다.** 매번 사용자 승인을 받는다. 세션 한정으로 자동 진행을 허락받은 경우만 예외이고 다음 세션으로 넘어가지 않는다.
- **PR base 는 `develop`** 이다. `main` 은 릴리스용.
- AI 가 만든 PR 에는 GitHub `AI` 라벨을 붙이고, 본문 맨 위에 AI 생성임을 인용 블록으로 밝힌다. 본문은 `git diff develop...HEAD` 전체를 근거로 요약하고 테스트 계획 체크리스트를 넣는다.
- 커밋 메시지는 한글 Conventional Commits, AI 커밋이면 본문에 `Committer: AI` trailer 를 단다.
- API Key·비밀번호·개인키는 절대 커밋하지 않는다. 의심되면 커밋을 멈춘다. `.env.example` 에는 키만 적고(`KEY=`) 값은 비운다.
