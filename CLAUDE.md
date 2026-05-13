# 아바팅(Avating) Web

AI 기반의 아바타 간 소개팅 시뮬레이션을 진행하고, 코치(실사용자)끼리 실제 소개팅까지 이어지는 서비스. 실사용자 매칭이 작동하는 실서비스이므로 성능·관측성·보안·배포 안정성을 항상 우선한다.

## 컨텍스트 진입점 (작업 전 반드시 확인)

| 목적                                                          | 단일 출처                                            | 사용 시점                                             |
| ------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| **현재 구현된 상태** (도메인·플로우·엔티티·API·UI·ADR 박제본) | [.claude/wiki/index.md](.claude/wiki/index.md)       | 모든 sub-agent 가 작업 직전 wiki-maintainer **QUERY** |
| **앞으로 어떻게 처리할지** (사람-검수 기능 명세·방향)         | `docs/spec/`, `.claude/docs/`                        | 새 기능 설계·요구 해석·향후 결정 판단 시              |
| 기술 스택 심화 · MUST/MUST NOT · CI 게이트                    | [.claude/skills/README.md](.claude/skills/README.md) | 스택 영역 수정 전 해당 SKILL.md 규칙·안티패턴 확인    |

---

## Karpathy 의사 결정 베이스라인

모든 코드 작성·수정·리뷰 진입 전 [`karpathy-guidelines`](.claude/skills/karpathy-guidelines/SKILL.md) 스킬을 로드해 적용한다. 규약·예시·체크리스트는 스킬 본문이 단일 출처.

예외: **LLM Wiki / 컨텍스트 인프라** 작업은 wiki 우선 규칙이 Karpathy 단순성을 override 한다 (ADR-001 §5). 기능 코드 자체는 Karpathy baseline 그대로.

---

## 아키텍처 핵심 (프로젝트 고유 값)

코드 변경 시 적용되는 공통 규율(불변성·Zod 경계 파싱·상태 분리·에러 경계·민감정보·접근성·주석·훅 스킵 금지)은 [.claude/skills/README.md §규율(공통)](.claude/skills/README.md) 및 각 SKILL.md 가 단일 출처. CLAUDE.md 에는 이 프로젝트만의 값·정책만 둔다.

- **레이어 방향**: `app → pages → features → entities → shared`. 역방향/동일 층 의존 금지. `eslint-plugin-boundaries` 가 강제.
- **경로 별칭**: `@/`(src), `@shared/`, `@features/`, `@entities/`, `@pages/` — tsconfig·vite·vitest 동기.
- **레이아웃 변경 금지**: 섹션 구조·그리드·컬럼·배경 등 시각 구성 수정은 **디자인 스펙 확정 후에만**. 동작(이벤트 핸들러, `select-none` 등) 수정은 해당 없음.

---

## 자주 쓰는 명령어

패키지 매니저는 `pnpm` 고정. 모든 명령은 프로젝트 루트에서 실행. 최초 셋업: `pnpm install`.

| 영역             | 명령                                | 비고                       |
| ---------------- | ----------------------------------- | -------------------------- |
| 개발 서버        | `pnpm dev`                          | Vite + MSW (dev)           |
| 타입 체크        | `pnpm typecheck`                    | `tsc -b --noEmit`          |
| 빌드             | `pnpm build`                        | typecheck → vite build     |
| 린트             | `pnpm lint` / `pnpm lint:fix`       | `--max-warnings=0`         |
| 포맷             | `pnpm format` / `pnpm format:check` | Prettier 3                 |
| 단위·통합 테스트 | `pnpm test` / `pnpm test:watch`     | Vitest + RTL               |
| 커버리지         | `pnpm test:coverage`                | v8 provider, 80%+ 게이트   |
| 프리뷰           | `pnpm preview`                      | `vite preview --port 4173` |

> `--no-verify` 등 Git 훅 우회 금지. 의존성 추가는 사용자 승인 후 `pnpm add`.

---

## 환경 / MSW 무결성 (이 프로젝트의 foot-gun)

- **env 파싱**: `src/shared/config/env.ts` 에서 Zod 런타임 파싱 — 실패 시 부팅 크래시. 클라이언트 노출은 `VITE_*` 접두사만, 비밀값(OAuth 서명 등)은 프론트에 두지 않음.
- **MSW BASE_URL**: 핸들러는 반드시 `import.meta.env.VITE_API_BASE_URL` 사용. 절대 URL 하드코딩 시 `.env.*` 변경 즉시 passthrough 사고.
- **vitest env 동기화**: `vitest.config.ts` 의 `test.env.VITE_API_BASE_URL` 과 `.env.development` 항상 동기 — 새 env 변수 추가 시 두 파일 함께 수정.
- **MSW unhandled**: server 는 `request:unhandled` 에서 throw — 핸들러 누락·URL 불일치가 테스트 즉시 실패로 이어지도록 강제.

---

## TDD · 품질 게이트 (CI 강제, 우회 금지)

- TDD 순서: Zod 스키마 → 테스트(RED) → 구현(GREEN) → 리팩터 → 커버리지 확인.
- 테스트는 **실제 사용자 플로우** 검증: 입력 → 제출 → 성공/에러 + 에러 상태 스타일(예: `border-danger`) + 트리거 타이밍(blur/change) + MSW 가로채기(`waitFor` 상태 변화). 렌더 확인만으로 끝내지 않는다.
- `tsc --noEmit` strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride`.
- ESLint `--max-warnings=0` · Prettier `--check` · Vitest 커버리지 **80%+** (v8).
- Playwright chromium + webkit (iOS Safari 호환 필수).
- 번들 예산(`size-limit`) 통과. 성능 예산 LCP < 2.5s · CLS < 0.1 · INP < 200ms.
- Git 훅 `--no-verify` 금지.

세부 안티패턴·체크리스트는 각 [SKILL.md](.claude/skills/README.md) 본문 참조.

---

## LLM Wiki ↔ docs 운용 (ADR-001)

### 시스템 역할

- **`.claude/wiki/`** = **현재 구현 상태의 박제본**. AI 1차 컨텍스트 저장소. 사용자 발언·결정·플로우·코드 변경 결과를 INGEST 로 박제하고, 모든 sub-agent 는 작업 시작 직전 QUERY 로 로드한다. "지금 코드가 무엇을 하고 있는가" 의 단일 근거. 새 에이전트가 매 세션 src/ 를 처음부터 학습하는 비용을 제거한다.
- **`docs/spec/` · `.claude/docs/`** = **앞으로의 방향·명세**. 사람-검수 진실. 새 기능 설계·요구 해석·향후 결정 판단의 단일 근거.

### Wiki 4가지 모드 — wiki-maintainer 스킬 ([.claude/skills/wiki-maintainer/](.claude/skills/wiki-maintainer/SKILL.md))

| 모드       | 트리거                                                  | 주체                                                      |
| ---------- | ------------------------------------------------------- | --------------------------------------------------------- |
| **INGEST** | 사용자 발언(사양·결정·플로우)을 wiki 페이지로 자동 박제 | avatar 가 매 사용자 턴 첫 단계에서 판정, wiki-avatar 위임 |
| **UPDATE** | 코드 변경 결과를 wiki 에 동기화                         | dev-avatar 가 작업 종료 직전 의무 호출                    |
| **LINT**   | wiki ↔ 코드 ↔ docs/spec drift 점검                      | pr-code-reviewer 가 PR 검증 시                            |
| **QUERY**  | 작업 시작 전 컨텍스트 로드                              | 모든 sub-agent                                            |

`.claude/wiki/` 의 모든 쓰기는 wiki-maintainer 스킬 경유만 허용 — 직접 편집 금지.

### 우선순위 / 충돌 처리

- **구현 확인 → wiki 우선** / **향후 결정 → docs 우선**.
- 동일 사실이 양쪽에 있고 모순일 때 AI 는 임의 봉합 금지.
- INGEST 가 docs 와 **모순/누락**을 발견하면 보고에 `spec-divergence` 또는 `spec-gap` 플래그를 포함하고 사용자에게 docs 갱신을 **요청**한다. **AI 는 `docs/spec/` 를 직접 작성·수정하지 않는다.**
- 사용자가 새 기능 Flow 를 설명하면 구현 전에 `docs/spec/<feature>.md` 작성을 사용자에게 요청한다.

---

## AI 작업물 파일 위치 (강제)

- AI 가 생성하는 모든 파일은 프로젝트 내 **`.claude/` 하위에만**.
  - 계획/설계 → `.claude/plans/`
  - 리서치/노트 → `.claude/notes/`
- 프로젝트 외부 경로(`~/.claude/*` 등) 저장 금지.
- `docs/` 는 사람 전용. AI 산출물을 공식 문서로 승격하려면 사용자가 직접 이동.

---

## 커밋 / PR

- 모든 형상관리는 [.claude/skills/git-flow-public-repo/SKILL.md](.claude/skills/git-flow-public-repo/SKILL.md) 가 최상위 정책.
- 커밋: 한글 Conventional Commits (`feat / fix / refactor / docs / test / chore / perf / ci`). AI 커밋은 본문 trailer `Committer: AI` 필수.
- **AI 자동 커밋 금지** — 매 커밋 사용자 승인 필수. 세션 한정 자동 진행 허가만 예외 (이월 금지). `--no-verify`·강제 서명(`Co-Authored-By` 등) 추가 금지.
- PR base 는 **`develop`** (`main` 은 릴리스 전용). PR 생성 시 `pr-code-reviewer-iterative` 게이트 통과 필수 — 발견사항 0건까지 fresh sub-agent 블라인드 리뷰 반복.
- AI 자동 생성 PR 은 GitHub `AI` 라벨 부착 + 본문 상단에 AI 생성 명시 인용 블록 필수. 본문은 `git diff develop...HEAD` 전체를 근거로 요약 + 테스트 계획 체크리스트.
- Public Repo 시크릿 차단: API Key/Password/Private Key 커밋 절대 금지, 의심 발견 시 AI 커밋 중단. `.env.example` 는 키만(`KEY=`), 실제 `.env` 류는 `.gitignore` 강제.
