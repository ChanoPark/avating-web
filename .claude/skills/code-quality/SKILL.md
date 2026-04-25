---
name: code-quality
description: ESLint 9 flat + Prettier 3 + Knip — 레이어드 경계 강제(boundaries), jsx-a11y, tailwindcss, typescript-eslint strict-type-checked
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(품질)
  - CLAUDE.md#프로젝트-구조-원칙
  - CLAUDE.md#품질-기준
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# Code Quality — Lint / Format / Dead-code

## 1. 방침

- **ESLint 9 flat config + typescript-eslint strict-type-checked** 기본.
- **레이어 경계는 코드로 강제** — `eslint-plugin-boundaries`.
- **Prettier** 는 스타일 포맷 한정. 코드 품질 규칙은 ESLint 에 위임.
- **Knip** 으로 데드 코드/미사용 의존성 상시 탐지.
- CI: 경고 0 (`--max-warnings=0`).

## 2. Install

```bash
pnpm add -D eslint@^9 typescript-eslint@^8 \
  @eslint/js globals \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh \
  eslint-plugin-jsx-a11y \
  eslint-plugin-tailwindcss \
  eslint-plugin-boundaries \
  eslint-plugin-import eslint-import-resolver-typescript \
  @tanstack/eslint-plugin-query \
  @typescript-eslint/parser \
  eslint-plugin-vitest eslint-plugin-playwright \
  prettier prettier-plugin-tailwindcss eslint-config-prettier \
  knip
```

## 3. ESLint flat config (실전 전체)

```ts
// eslint.config.ts
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tailwind from 'eslint-plugin-tailwindcss';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import vitest from 'eslint-plugin-vitest';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'storybook-static', 'playwright-report', 'node_modules'] },

  /* ---------- 공통: JS/TS ---------- */
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { project: ['./tsconfig.app.json','./tsconfig.node.json'], tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.es2023 },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { typescript: { project: ['./tsconfig.app.json','./tsconfig.node.json'] } },
      'boundaries/elements': [
        { type: 'app',      pattern: 'src/app/**' },
        { type: 'pages',    pattern: 'src/pages/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'entities', pattern: 'src/entities/**' },
        { type: 'shared',   pattern: 'src/shared/**' },
      ],
      'boundaries/include': ['src/**/*.{ts,tsx}'],
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      tailwindcss: tailwind,
      boundaries,
      import: importPlugin,
      '@tanstack/query': tanstackQuery,
    },
    rules: {
      /* TypeScript strictness */
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' , varsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description', 'ts-ignore': true, 'ts-nocheck': true, minimumDescriptionLength: 8,
      }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      /* React */
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
      'react/self-closing-comp': 'error',
      'react/no-array-index-key': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      /* A11y */
      ...jsxA11y.flatConfigs.recommended.rules,
      'jsx-a11y/no-autofocus': 'error',

      /* Tailwind */
      ...tailwind.configs['flat/recommended'][0].rules,
      'tailwindcss/classnames-order': 'off', /* prettier-plugin-tailwindcss 와 중복 */
      'tailwindcss/no-custom-classname': ['warn', { whitelist: ['sr-only','animate-.*','dark'] }],

      /* Import */
      'import/no-cycle': ['error', { maxDepth: 3 }],
      'import/no-internal-modules': ['error', {
        forbid: ['@features/*/!(index)', '@entities/*/!(index)'],
      }],
      'import/order': ['error', {
        'newlines-between': 'always',
        groups: ['builtin','external','internal','parent','sibling','index','type'],
        pathGroups: [
          { pattern: '@app/**',      group: 'internal', position: 'before' },
          { pattern: '@pages/**',    group: 'internal' },
          { pattern: '@features/**', group: 'internal' },
          { pattern: '@entities/**', group: 'internal' },
          { pattern: '@shared/**',   group: 'internal', position: 'after' },
        ],
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],

      /* Boundaries — 레이어 단방향 */
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'app',      allow: ['pages','features','entities','shared'] },
          { from: 'pages',    allow: ['features','entities','shared'] },
          { from: 'features', allow: ['entities','shared'] },
          { from: 'entities', allow: ['shared'] },
          { from: 'shared',   allow: ['shared'] },
        ],
      }],
      'boundaries/no-unknown': 'error',
      'boundaries/no-unknown-files': 'off',

      /* TanStack Query */
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-rest-destructuring': 'error',
      '@tanstack/query/stable-query-client': 'error',
    },
  },

  /* ---------- 테스트 전용 ---------- */
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}'],
    plugins: { vitest },
    rules: { ...vitest.configs.recommended.rules, 'vitest/expect-expect': 'error' },
  },
  {
    files: ['e2e/**/*.ts'],
    plugins: { playwright },
    rules: { ...playwright.configs.recommended.rules },
  },

  /* ---------- Storybook ---------- */
  {
    files: ['**/*.stories.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off', 'import/no-internal-modules': 'off' },
  },

  /* ---------- Prettier 호환 (항상 마지막) ---------- */
  prettier,
);
```

## 4. Prettier

```jsonc
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- `.prettierignore` 에 `dist`, `coverage`, `storybook-static`, `playwright-report` 추가.
- IDE: VS Code `editor.formatOnSave: true` + ESLint `eslint.experimental.useFlatConfig: true`.

## 5. Knip — 데드 코드/의존 감시

```ts
// knip.config.ts
import type { KnipConfig } from 'knip';
const config: KnipConfig = {
  entry: ['src/app/main.tsx', 'vitest.setup.ts', 'e2e/**/*.ts', '.storybook/**/*.ts'],
  project: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts', '.storybook/**/*.ts'],
  ignoreDependencies: ['@types/*'],
  vite: true,
  vitest: true,
  playwright: true,
  storybook: true,
  ignore: ['src/shared/mocks/**', 'src/**/*.stories.{ts,tsx}'],
};
export default config;
```

- CI에서 `knip --reporter compact` 를 `--no-exit-code` 없이 실행.
- 미사용 export 는 PR 에서 삭제.

## 6. 레이어 규칙 상세

```
app  → pages → features → entities → shared
```

구체 금지 사례:
- `shared/ui/Button.tsx` 내부에서 `import { useAvatar } from '@entities/avatar'` — ❌.
- `entities/avatar/api.ts` 내부에서 `import { toast } from '@shared/ui/Toast'` — ❌(부작용). `entities` 는 순수 모델/쿼리만.
- `features/matching/ui/...` 가 `@features/intervention/*/ui/*` 의 내부 파일 직접 import — ❌. 외부는 `@features/intervention` 의 `index.ts` public API 만 사용.

## 7. 스크립트

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --check .",
    "format:fix": "prettier --write .",
    "typecheck": "tsc -b --pretty",
    "deadcode": "knip --reporter compact",
    "quality": "pnpm lint && pnpm format && pnpm typecheck && pnpm deadcode"
  }
}
```

## 8. CI 게이트

- `pnpm install --frozen-lockfile`
- `pnpm quality`
- `pnpm test:cov`
- `pnpm build`
- `pnpm e2e`
- `pnpm lhci`

어느 하나라도 실패 → 머지 차단.

## 9. IDE / Editor

- VSCode 추천 확장(.vscode/extensions.json):
  - `dbaeumer.vscode-eslint`
  - `esbenp.prettier-vscode`
  - `bradlc.vscode-tailwindcss`
  - `ms-playwright.playwright`
  - `vitest.explorer`
- `settings.json` 권장:
  ```json
  {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
    "eslint.experimental.useFlatConfig": true,
    "typescript.tsdk": "node_modules/typescript/lib"
  }
  ```

## 10. 안티패턴

- ESLint 9 flat config + 레거시 `.eslintrc.*` 혼용.
- `eslint-disable-next-line` 남발 — 사유 주석 필수(`ban-ts-comment` 와 동일 규칙).
- `prettier --write` 없이 수동 정렬.
- Knip warning 을 장기 방치.
- 팀 공용 규칙을 특정 개발자 로컬 설정으로 우회.
- `no-floating-promises` 우회하기 위해 `void` 를 남용(비동기 핵심 흐름 은폐).

## 11. References

- [ESLint flat config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [typescript-eslint strict-type-checked](https://typescript-eslint.io/users/configs#strict-type-checked)
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries)
- [Knip](https://knip.dev/)
- [TanStack ESLint plugin](https://tanstack.com/query/latest/docs/eslint/eslint-plugin-query)
- 내부: [typescript-strict](../typescript-strict/SKILL.md), [vite-react19](../vite-react19/SKILL.md)
