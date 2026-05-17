import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/main.tsx',
    'src/app/App.tsx',
    'src/app/router.tsx',
    'src/mocks/browser.ts',
    'src/mocks/server.ts',
    'src/mocks/handlers/**/*.ts',
    'src/test/**/*.ts',
    'vite.config.ts',
    'vitest.config.ts',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignore: [
    'src/**/*.stories.tsx',
    'src/**/*.test.{ts,tsx}',
    'src/**/__tests__/**',
    'src/**/*.fixtures.ts',
  ],
  ignoreDependencies: [
    // ESLint v4 호환 미흡으로 미배선 — 도입 시점에 제거
    'eslint-plugin-tailwindcss',
    // PostCSS·Prettier 가 동적 로드, knip 정적 분석 미검출
    'prettier-plugin-tailwindcss',
    '@tailwindcss/postcss',
    // Tailwind v4 엔진. @tailwindcss/postcss 의 peer — knip 정적 미검출
    'tailwindcss',
  ],
  // Phase 3 전환 정책: 사전 존재 unused exports/types 는 warn (게이트 비차단),
  // 신규 unused files / unlisted dependencies / duplicates 는 error (차단).
  // StatBar-style 모듈 단위 누락 (b0129d9) 은 files 룰로 즉시 차단된다.
  // exports/types 정리는 별도 후속 PR (entities/*/index.ts 일괄 정리) 로 분리.
  rules: {
    files: 'error',
    dependencies: 'error',
    unlisted: 'error',
    binaries: 'error',
    unresolved: 'error',
    duplicates: 'error',
    exports: 'warn',
    types: 'warn',
    nsExports: 'warn',
    nsTypes: 'warn',
    enumMembers: 'warn',
  },
};

export default config;
