import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collapseToModule,
  buildForwardGraph,
  transitiveClosure,
  computeBlastRadius,
  renderCodemapBlock,
} from '../codemap-core.mjs';

const FIXTURE_DC = {
  modules: [
    {
      source: 'src/pages/login/LoginPage.tsx',
      dependencies: [
        { resolved: 'src/features/auth/ui/LoginForm.tsx', dependencyTypes: ['local', 'import'] },
        { resolved: 'node_modules/react-router/index.js', dependencyTypes: ['npm', 'import'] },
      ],
    },
    {
      source: 'src/features/auth/ui/LoginForm.tsx',
      dependencies: [
        { resolved: 'src/entities/auth/model.ts', dependencyTypes: ['aliased', 'import'] },
        { resolved: 'src/entities/auth/model.ts', dependencyTypes: ['aliased', 'type-only'] },
        { resolved: 'src/shared/ui/Button.tsx', dependencyTypes: ['aliased', 'import'] },
      ],
    },
    {
      source: 'src/features/auth/api/useLogin.ts',
      dependencies: [
        { resolved: 'src/entities/auth/store.ts', dependencyTypes: ['aliased', 'import'] },
        { resolved: 'src/entities/auth/model.ts', dependencyTypes: ['aliased', 'type-only'] },
        { resolved: 'src/shared/api/http.ts', dependencyTypes: ['aliased', 'import'] },
      ],
    },
  ],
};

test('collapseToModule maps FSD layers to module nodes', () => {
  assert.equal(collapseToModule('src/features/auth/ui/LoginForm.tsx'), 'features/auth');
  assert.equal(collapseToModule('src/entities/auth/model.ts'), 'entities/auth');
  assert.equal(collapseToModule('src/pages/login/LoginPage.tsx'), 'login');
  assert.equal(collapseToModule('src/shared/ui/Button.tsx'), 'shared/ui');
  assert.equal(collapseToModule('src/app/router.tsx'), 'app');
  assert.equal(collapseToModule('node_modules/react-router/index.js'), null);
  assert.equal(collapseToModule(undefined), null);
  assert.equal(collapseToModule('src/something.ts'), null);
});

test('buildForwardGraph drops type-only edges and external modules', () => {
  const g = buildForwardGraph(FIXTURE_DC);
  assert.deepEqual([...(g.get('login') ?? [])], ['features/auth']);
  assert.deepEqual([...(g.get('features/auth') ?? [])].sort(), [
    'entities/auth',
    'shared/api',
    'shared/ui',
  ]);
  // entities/auth registered as a node even with no outgoing edges.
  assert.ok(g.has('entities/auth'));
  assert.deepEqual([...(g.get('entities/auth') ?? [])], []);
  // node_modules dependency excluded.
  assert.ok(!g.has(null));
});

test('transitiveClosure excludes root in an acyclic graph', () => {
  const g = buildForwardGraph(FIXTURE_DC);
  const reached = transitiveClosure(g, 'login').sort();
  assert.deepEqual(reached, ['entities/auth', 'features/auth', 'shared/api', 'shared/ui']);
  assert.ok(!reached.includes('login'));
});

test('transitiveClosure terminates on a 2-node cycle', () => {
  const g = new Map();
  g.set('avatar', new Set(['match-request']));
  g.set('match-request', new Set(['avatar']));
  const reached = transitiveClosure(g, 'avatar').sort();
  // root re-included via cycle.
  assert.deepEqual(reached, ['avatar', 'match-request']);
});

test('computeBlastRadius maps each module to co-dependent screens', () => {
  const g = buildForwardGraph(FIXTURE_DC);
  const blast = computeBlastRadius(g, ['login']);
  assert.deepEqual([...(blast.get('features/auth') ?? [])].sort(), ['login']);
  assert.deepEqual([...(blast.get('entities/auth') ?? [])].sort(), ['login']);
});

test('renderCodemapBlock produces the exact deterministic block', () => {
  const dc = structuredClone(FIXTURE_DC);
  dc.modules.push({
    source: 'src/pages/signup/SignupPage.tsx',
    dependencies: [
      { resolved: 'src/features/auth/ui/SignupForm.tsx', dependencyTypes: ['local', 'import'] },
    ],
  });
  dc.modules.push({
    source: 'src/features/auth/ui/SignupForm.tsx',
    dependencies: [
      { resolved: 'src/entities/auth/model.ts', dependencyTypes: ['aliased', 'import'] },
    ],
  });
  const g = buildForwardGraph(dc);
  const block = renderCodemapBlock(g, 'login', ['login', 'signup']);

  const expected = [
    '```mermaid',
    'flowchart TD',
    '  entities_auth["entities/auth"]',
    '  features_auth["features/auth"]',
    '  login["login"]',
    '  signup["signup"]',
    '  login --> features_auth',
    '  features_auth --> entities_auth',
    '  entities_auth -.-> signup',
    '  features_auth -.-> signup',
    '```',
    '',
    '| 모듈 | 종류 | 방향 | 공의존 화면 |',
    '|---|---|---|---|',
    '| entities/auth | entity | 의존 | login, signup |',
    '| features/auth | feature | 의존 | login, signup |',
    '| shared/api | shared | 의존 | +1 via shared |',
    '| shared/ui | shared | 의존 | +1 via shared |',
  ].join('\n');

  assert.equal(block, expected);
});

test('renderCodemapBlock is deterministic across repeated calls', () => {
  const g = buildForwardGraph(FIXTURE_DC);
  const a = renderCodemapBlock(g, 'login', ['login']);
  const b = renderCodemapBlock(g, 'login', ['login']);
  assert.equal(a, b);
  assert.ok(!a.endsWith('\n'));
});
