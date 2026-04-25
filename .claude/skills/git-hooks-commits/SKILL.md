---
name: git-hooks-commits
description: Husky v9 + lint-staged + commitlint — Conventional Commits 강제, PR 플로우, 브랜치 보호, --no-verify 금지
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(Git-훅)
  - CLAUDE.md#커밋-PR
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# Git Hooks & Conventional Commits

## 1. 철학

- **훅은 로컬 사전 방어선**. CI 가 2차 방어선. 둘 다 통과해야 머지.
- **훅 스킵 금지**. `--no-verify`, `--no-gpg-sign` 등은 이 프로젝트에서 **사용 금지**. 예외는 운영사고 대응 PR 에 한함(사후 기록 필수).
- **커밋 서명/공동 작성자(`Co-Authored-By`) 자동 부여 금지** — 사용자 글로벌 설정에서 비활성화됨. Claude 도 임의 추가 금지.

## 2. Install

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
pnpm exec husky init
```

`package.json`:
```json
{
  "scripts": { "prepare": "husky" }
}
```

## 3. Husky v9 훅

### 3.1 `.husky/pre-commit`
```sh
pnpm exec lint-staged
```

### 3.2 `.husky/commit-msg`
```sh
pnpm exec commitlint --edit "$1"
```

### 3.3 `.husky/pre-push` (선택 — 빠른 타입체크)
```sh
pnpm typecheck
```

> 주의: `pre-push` 에 E2E/전체 테스트까지 얹지 않는다. 개발자 피드백 루프가 급격히 길어짐.

## 4. lint-staged

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{css,md,mdx,json,yml,yaml}": ["prettier --write"],
    "*.{ts,tsx,js,jsx}": ["bash -c 'pnpm typecheck'"]
  }
}
```

- 스테이징된 파일만 검사 → 빠른 피드백.
- 타입체크는 전체 `tsc -b` — 스테이지 단위가 아닌 프로젝트 단위로 해야 의미.

## 5. Commitlint — Conventional Commits

```js
// commitlint.config.cjs
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat','fix','refactor','docs','test','chore','perf','ci','build','style','revert']],
    'scope-empty': [0],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 120],
  },
};
```

### 허용 타입
- `feat` 새 기능
- `fix` 버그 수정
- `refactor` 구조 변경(기능 동일)
- `docs` 문서
- `test` 테스트 추가/수정
- `chore` 도구/설정
- `perf` 성능 개선
- `ci` CI 변경
- `build` 빌드/의존성
- `style` 포매팅/코멘트(로직 변경 없음)
- `revert` 되돌리기

### 스코프 권장
```
feat(matching): 드라마 인젝션 강도 3단계 추가
fix(onboarding): 연결 코드 만료 24h → 1h
refactor(shared/api): axios 인터셉터 모듈 분리
```

## 6. 브랜치 & PR 전략

- **base**: `main` (보호됨) / **release tag**: `v*.*.*`.
- **feature 브랜치**: `feat/<scope>-<short-desc>` (`feat/matching-drama-injection`).
- **fix**: `fix/<scope>-<short-desc>`.
- PR 머지는 **Squash merge 기본** — 커밋 메시지를 타입/스코프로 정돈.
- `main` 보호: PR 필수 + 리뷰 1인 + 전체 CI 통과.

## 7. PR 본문 템플릿 (`.github/pull_request_template.md`)

```md
## 요약
- …(what/why)

## 변경 영역
- [ ] app / pages / features / entities / shared / infra

## 테스트
- [ ] 단위
- [ ] 통합(MSW)
- [ ] E2E
- [ ] 접근성(axe)
- [ ] 수기 검증: …

## 관측성
- [ ] 새로운 에러 경계/Sentry 태그 점검
- [ ] Amplitude 이벤트 스키마 업데이트

## 롤아웃 / 플래그
- [ ] GrowthBook 플래그 필요 여부: …
- [ ] 롤백 전략: …

## 스크린샷 / 데모
<details><summary>before/after</summary>...</details>
```

## 8. 커밋 메시지 예시

```
feat(intervention): 다이아 소모량 서버 검증 연동

- 결제 서명 응답을 Zod 로 파싱하고 실패 시 재시도
- 서버 응답의 retryable 플래그를 ErrorBoundary 로 전파

Closes: INT-231
```

단일 커밋에 복수 도메인이 섞이는 것은 피한다(리뷰 난이도↑).

## 9. 예외 상황 가이드

| 상황 | 올바른 대응 |
|---|---|
| 훅 실패 | 원인 수정 → **새 커밋** 생성 (amend 금지 — 이전 커밋은 훅 실패로 생성되지 않음) |
| 빠른 핫픽스 | `fix/hotfix-...` 브랜치, PR/리뷰는 유지. CI 최소 세트만 실행하도록 workflow 분기 |
| 대용량 포맷 커밋 | `style:` 타입, 가능한 경우 파일 단위 분리 |
| 되돌리기 | `git revert` + `revert:` 타입 커밋. `reset --hard` 로 상위 수정 금지 |

## 10. 안티패턴

- `--no-verify` / `--no-gpg-sign` 사용.
- 훅을 개인 설정으로 비활성화 (`core.hooksPath` 변경).
- `Co-Authored-By: Claude ...` 자동 부여.
- `HEAD^` amend 로 원격 브랜치 재작성(force-push).
- 한 커밋에 10+ 파일, 여러 도메인 변경.
- 이슈 번호만 있고 한국어 요약 없는 커밋.

## 11. CI 최소 세트

```yaml
# .github/workflows/ci.yml (발췌)
jobs:
  quality:
    steps:
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm quality
      - run: pnpm test:cov
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium webkit
      - run: pnpm e2e
      - run: pnpm lhci
```

## 12. References

- [Husky v9](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/okonet/lint-staged)
- [commitlint](https://commitlint.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- 내부: [code-quality](../code-quality/SKILL.md), [testing-stack](../testing-stack/SKILL.md)
