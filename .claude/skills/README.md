---
name: avating-web skills index
description: 확정 기술 스택별 Skills 인덱스 (예정 기술/인프라 제외) — 각 Skill 은 Instructions + Rules 를 포함한 심화 문서
version: 2.0.0
scope: avating-web
authority: index
maintainer: frontend-core
---

# Skills — avating-web

[CLAUDE.md](../../CLAUDE.md) 의 **확정 기술 스택** 중 "예정" 항목(결제·소셜 로그인) 과
인프라/IaC/CI·CD(AWS·Terraform·GitHub Actions) 를 제외한 기술에 대한 심화 Skill 문서 모음.

각 SKILL.md 는 다음을 모두 포함한다:
- **Instructions** — 공식/대기업 권장 아키텍처 근거, 설치·설정 절차, 실전 코드.
- **Rules** — MUST / MUST NOT 형태의 강제 규칙, 안티패턴.
- **Quality gates** — CI/테스트/커버리지/번들·성능 예산.
- **References** — 공식 문서 + 신뢰할 만한 커뮤니티 레퍼런스.

## 사용 방식

- 기술 선택 변경/업그레이드는 **해당 SKILL.md 를 먼저 갱신**하고, 이어서 [CLAUDE.md](../../CLAUDE.md) 의 요약 테이블을 동기화한다.
- PR 리뷰어는 자신이 수정한 영역에 해당하는 Skill 의 **규칙 / 안티패턴 / 체크리스트** 에 위배되는지 점검한다.
- 모든 파일은 프로젝트 내 `.claude/` 하위에 둔다. 외부 경로 저장 금지.

## Index

### Foundation
| # | Skill | 주제 |
|---|-------|------|
| 01 | [typescript-strict](./typescript-strict/SKILL.md) | TS 5 strict 설정, 경로 별칭, 경계 검증, 브랜디드 타입 |
| 02 | [vite-react19](./vite-react19/SKILL.md) | Vite 6 + React 19 + FSD 영감의 레이어 구조, 번들 예산 |
| 03 | [react-router-spa](./react-router-spa/SKILL.md) | React Router v7 Library Mode, 로더/가드/SPA fallback |

### UI / Styling
| # | Skill | 주제 |
|---|-------|------|
| 04 | [styling-tailwind-motion](./styling-tailwind-motion/SKILL.md) | Tailwind v4 `@theme`, cva, Motion, Lucide, 다크모드·접근성 |
| 11 | [storybook-a11y](./storybook-a11y/SKILL.md) | Storybook 8 + a11y + MSW 데코레이터, interaction 테스트 |

### Data / State / Forms
| # | Skill | 주제 |
|---|-------|------|
| 05 | [data-tanstack-axios-zod](./data-tanstack-axios-zod/SKILL.md) | 서버 상태 표준, 쿼리키 팩토리, 인터셉터/리프레시, 낙관적 업데이트 |
| 06 | [client-state-zustand](./client-state-zustand/SKILL.md) | Zustand 슬라이스, 셀렉터·미들웨어, persist 보안 |
| 07 | [forms-rhf-zod](./forms-rhf-zod/SKILL.md) | RHF + Zod, 공용 Field, 위저드, 서버 에러 매핑 |

### Runtime / Resilience
| # | Skill | 주제 |
|---|-------|------|
| 08 | [error-suspense-boundary](./error-suspense-boundary/SKILL.md) | Suspense + ErrorBoundary 계층화, Sentry 연동, 복구 UX |
| 09 | [mocking-msw](./mocking-msw/SKILL.md) | MSW v2 dev/test 공용, 팩토리·시나리오, 번들 제외 |
| 10 | [testing-stack](./testing-stack/SKILL.md) | Vitest + RTL + Playwright + axe + Lighthouse CI — TDD 80% |

### Quality / DX
| # | Skill | 주제 |
|---|-------|------|
| 12 | [code-quality](./code-quality/SKILL.md) | ESLint 9 flat + Prettier + Knip + boundaries + typescript-eslint |
| 13 | [git-hooks-commits](./git-hooks-commits/SKILL.md) | Husky v9 + lint-staged + commitlint, PR 템플릿, 브랜치 전략 |
| 13a | [git-flow-public-repo](./git-flow-public-repo/SKILL.md) | Git Flow + Public Repo 보안 + 한글 Conventional Commits + AI committer — 최상위 정책 |

### Observability / Experimentation
| # | Skill | 주제 |
|---|-------|------|
| 14 | [observability-sentry-amplitude](./observability-sentry-amplitude/SKILL.md) | Sentry(에러/RUM/Replay) + Amplitude 스키마 중앙화, PII 스크러빙 |
| 15 | [feature-flags-growthbook](./feature-flags-growthbook/SKILL.md) | GrowthBook 타입안전 훅, kill-switch, 실험 노출 이벤트 |

## 범위에서 제외된 항목

### 예정(Planned) — 추후 별도 스킬화
- **결제**: 토스페이먼츠 / 포트원 (서명은 백엔드 위임이 원칙).
- **소셜 로그인**: Kakao / Naver / Apple / Google.

### 인프라 / 배포 / IaC — 프론트 앱 외 영역
- AWS CloudFront + S3 (OAC), ACM, Route53, WAF, Origin Shield(ICN).
- Terraform (S3 remote state + DynamoDB lock).
- GitHub Actions + OIDC → IAM Role.

이 영역은 [.claude/plans/project-setup-plan.md](../plans/project-setup-plan.md) 와 별도 runbook(`.claude/runbook/`) 에 기록한다.

## 규율 (공통)

1. **불변성**: 객체/배열 변이 금지 — 항상 새 값 반환.
2. **경계 검증**: 외부 경계(HTTP, storage, URL)에서 Zod 로 파싱.
3. **레이어 방향**: `app → pages → features → entities → shared`. 역방향 금지.
4. **관측성**: 에러/이벤트는 단일 진실(Sentry / Amplitude) 유지, 중복 수집 금지.
5. **접근성**: 키보드 접근 + WCAG AA + axe 위반 0.
6. **민감정보**: PII 는 Sentry scrubbing + localStorage 저장 금지 + URL 쿼리 마스킹.
7. **훅 스킵 금지**: `--no-verify` 사용하지 않는다.
8. **주석 정책**: 기본은 주석 없음. 자명하지 않은 "왜" 만 한 줄.
