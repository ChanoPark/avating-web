// dependency-cruiser 설정 — 코드맵 생성 전용 (린트 규칙 아님)
// tsconfig.app.json paths 로 @/ 별칭 해석, 테스트/목/외부 제외.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  options: {
    tsConfig: { fileName: 'tsconfig.app.json' }, // @features/ 등 별칭 해석 (moduleResolution: bundler)
    tsPreCompilationDeps: true, // import type 도 그래프에 포함하되 dependencyTypes 에 'type-only' 태깅 → 스크립트가 필터
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: [
        'node_modules',
        'dist',
        '\\.test\\.(ts|tsx)$',
        '\\.spec\\.(ts|tsx)$',
        '\\.stories\\.(ts|tsx)$',
        '__tests__',
        'src/shared/mocks',
        'src/test',
      ],
    },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require'] },
  },
};
