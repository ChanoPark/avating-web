import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/app/App.tsx',
    'src/app/router.tsx',
    'src/shared/mocks/browser.ts',
    'src/shared/mocks/server.ts',
    'src/shared/mocks/handlers/**/*.ts',
    'src/test/**/*.ts',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignoreDependencies: [
    // Tailwind v4 엔진. @tailwindcss/postcss 의 peer — knip 정적 미검출
    'tailwindcss',
  ],
  // exports/types 는 warn (게이트 비차단) — 잔여 항목은 openapi 의 라이브
  // 엔드포인트를 미러링하는 계약 스키마라 참조가 없어도 유지한다.
  // 신규 unused files / unlisted dependencies / duplicates 는 error (차단).
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
