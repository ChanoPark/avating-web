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
    // ESLint v4 호환 미흡으로 미배선 — 도입 시점에 제거
    'eslint-plugin-tailwindcss',
    // Tailwind v4 엔진. @tailwindcss/postcss 의 peer — knip 정적 미검출
    'tailwindcss',
    // CLI 전용 (pnpm exec depcruise) — 코드맵 생성 스크립트가 spawn, knip 정적 미검출
    'dependency-cruiser',
  ],
  // exports/types 는 warn 유지 (게이트 비차단). 남은 4건(refreshRequestSchema,
  // PublicKeyResponse, LoginRequest, SignupRequest)은 .claude/api/openapi.yaml 의
  // 라이브 엔드포인트를 미러링하는 의도적 계약 스키마라 삭제하지 않는다.
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
