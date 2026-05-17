import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import boundaries from 'eslint-plugin-boundaries';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import importPlugin from 'eslint-plugin-import';
import vitest from '@vitest/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'playwright-report',
      '.claude',
      'storybook-static',
    ],
  },

  // Base JS rules — apply everywhere.
  js.configs.recommended,

  // Non-type-checked TS rules — apply to all TS files (including configs).
  ...tseslint.configs.recommended,

  // Type-checked TS rules — src/** only (needs TS project service).
  // Test files are excluded here because they're excluded from tsconfig.app.json.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}', 'src/**/*.test.tsx'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      boundaries,
      '@tanstack/query': tanstackQuery,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'pages', pattern: 'src/pages/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'entities', pattern: 'src/entities/**' },
        // shared/mocks 는 entity 타입을 알아야 하는 dev/test 인프라 — 별도 element
        { type: 'shared-mocks', pattern: 'src/shared/mocks/**' },
        { type: 'shared', pattern: 'src/shared/**' },
      ],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './tsconfig.app.json'],
        },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...tanstackQuery.configs['flat/recommended'][0].rules,
      // import plugin recommended는 무겁고 import order 등 장식 위주.
      // HIGH 누설 카테고리에 직결되는 항목만 선별:
      'import/no-cycle': ['error', { maxDepth: 4 }],
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-duplicates': 'error',

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Layer boundaries (app > pages > features > entities > shared).
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'app',
              allow: ['app', 'pages', 'features', 'entities', 'shared', 'shared-mocks'],
            },
            { from: 'pages', allow: ['pages', 'features', 'entities', 'shared', 'shared-mocks'] },
            { from: 'features', allow: ['features', 'entities', 'shared', 'shared-mocks'] },
            { from: 'entities', allow: ['entities', 'shared'] },
            { from: 'shared', allow: ['shared'] },
            // shared/mocks 는 dev/test 인프라 — entity 타입 import 허용
            { from: 'shared-mocks', allow: ['shared', 'shared-mocks', 'entities'] },
          ],
        },
      ],

      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Tests — relax unsafe-any rules for jsdom + testing-library ergonomics.
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // 테스트 안티패턴 차단 (HIGH 누설: 가짜 테스트 / .only 잔존 / disabled 테스트):
      'vitest/no-focused-tests': 'error', // .only 가 staged 되면 차단
      'vitest/no-disabled-tests': 'error', // .skip / .todo 가 staged 되면 차단
      'vitest/no-identical-title': 'error', // 동일 제목 테스트 중복 (덮어쓰기 위험)
      'vitest/no-commented-out-tests': 'error', // 주석 처리된 테스트
      'vitest/expect-expect': [
        'error',
        {
          // 단언 없는 가짜 테스트 차단 (testing-stack § 11 정합).
          // wildcard 패턴(`expect*` 등)은 forward trap (헬퍼명만 보고 통과시킴) — 순정 expect 만 인정.
          // 헬퍼 안의 expect 가 필요하면 헬퍼 이름을 *명시적* 으로 추가 (예: 'expectVisibleAndEnabled').
          assertFunctionNames: ['expect'],
        },
      ],
    },
  },

  // Node-land config files.
  {
    files: ['*.config.{js,ts,mjs,cjs}', 'vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Prettier conflict guard — *반드시 마지막* (다른 룰의 stylistic 규칙을 disable).
  // Prettier 와 ESLint 의 무한 충돌 방지 (code-quality SKILL.md § 3 정합).
  prettierConfig
);
