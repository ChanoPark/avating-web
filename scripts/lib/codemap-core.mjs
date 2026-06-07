// codemap-core — 순수 함수만. fs/dependency-cruiser 의존 없음 (테스트 가능 단위).
// dependency-cruiser JSON import 그래프 → FSD 모듈 단위 codemap(Mermaid + 표) 결정적 렌더.

/**
 * 파일 경로를 FSD 모듈 노드로 collapse.
 * - pages → screen id (디렉터리명)
 * - features|entities|shared → `${layer}/${name}`
 * - app → 'app'
 * - 그 외/외부/undefined → null
 * @param {string | undefined} path
 * @returns {string | null}
 */
export function collapseToModule(path) {
  if (typeof path !== 'string') return null;
  const m = /^src\/([^/]+)\/([^/]+)/.exec(path);
  if (!m) return null;
  const layer = m[1];
  const name = m[2];
  if (layer === 'pages') return name;
  if (layer === 'features' || layer === 'entities' || layer === 'shared') return `${layer}/${name}`;
  if (layer === 'app') return 'app';
  return null;
}

/**
 * dependency-cruiser JSON → forward 그래프 Map<module, Set<module>>.
 * type-only 엣지(Δ6)·외부 모듈·self-edge 제외. 도착 노드도 그래프에 등록.
 * @param {{ modules?: Array<{ source?: string, dependencies?: Array<{ resolved?: string, dependencyTypes?: string[] }> }> }} dcJson
 * @returns {Map<string, Set<string>>}
 */
export function buildForwardGraph(dcJson) {
  /** @type {Map<string, Set<string>>} */
  const graph = new Map();
  const ensure = (node) => {
    if (!graph.has(node)) graph.set(node, new Set());
    return graph.get(node);
  };

  const modules = dcJson?.modules ?? [];
  for (const mod of modules) {
    const from = collapseToModule(mod?.source);
    if (from === null) continue;
    const fromSet = ensure(from);
    for (const dep of mod?.dependencies ?? []) {
      if ((dep?.dependencyTypes ?? []).includes('type-only')) continue;
      const to = collapseToModule(dep?.resolved);
      if (to === null || to === from) continue;
      ensure(to);
      fromSet.add(to);
    }
  }
  return graph;
}

/**
 * root 에서 도달 가능한 모듈 배열. 사이클 시 visited 로 종료.
 * root 는 사이클로 재진입하지 않는 한 제외.
 * @param {Map<string, Set<string>>} graph
 * @param {string} root
 * @returns {string[]}
 */
export function transitiveClosure(graph, root) {
  /** @type {Set<string>} */
  const visited = new Set();
  /** @type {string[]} */
  const reached = [];
  const walk = (node) => {
    for (const next of graph.get(node) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      reached.push(next);
      walk(next);
    }
  };
  walk(root);
  return reached;
}

/**
 * 각 screen 의 transitiveClosure 를 합쳐 모듈별 공의존 화면 집합 산출.
 * @param {Map<string, Set<string>>} graph
 * @param {string[]} screens
 * @returns {Map<string, Set<string>>}
 */
export function computeBlastRadius(graph, screens) {
  /** @type {Map<string, Set<string>>} */
  const blast = new Map();
  for (const screen of screens) {
    if (!graph.has(screen)) continue;
    for (const mod of transitiveClosure(graph, screen)) {
      if (!blast.has(mod)) blast.set(mod, new Set());
      blast.get(mod).add(screen);
    }
  }
  return blast;
}

/** 모듈명 → mermaid 노드 id. */
function nodeId(mod) {
  return mod.replace(/[/-]/g, '_');
}

/** 모듈 → 표/노드 종류. */
function kindOf(mod) {
  if (mod.startsWith('features/')) return 'feature';
  if (mod.startsWith('entities/')) return 'entity';
  if (mod.startsWith('shared/')) return 'shared';
  return 'screen';
}

/**
 * 결정적 codemap 블록(Mermaid 펜스 + 빈 줄 + 마크다운 표) 렌더. 후행 개행 없음.
 * @param {Map<string, Set<string>>} graph
 * @param {string} screen
 * @param {string[]} screens
 * @returns {string}
 */
export function renderCodemapBlock(graph, screen, screens) {
  const downstream = transitiveClosure(graph, screen).sort();
  const firstParty = downstream.filter((m) => !m.startsWith('shared/'));
  const sharedMods = downstream.filter((m) => m.startsWith('shared/')).sort();
  const blast = computeBlastRadius(graph, screens);

  // 선언할 노드: screen + firstParty + blast 공의존 화면. 모듈명 알파벳 정렬.
  const nodeSet = new Set([screen, ...firstParty]);
  for (const m of firstParty) {
    for (const s of blast.get(m) ?? []) {
      if (s !== screen) nodeSet.add(s);
    }
  }
  const nodes = [...nodeSet].sort();

  /** @type {string[]} */
  const lines = ['```mermaid', 'flowchart TD'];
  for (const n of nodes) {
    lines.push(`  ${nodeId(n)}["${n}"]`);
  }

  // downstream 엣지 (shared 제외).
  for (const from of [screen, ...firstParty]) {
    for (const to of [...(graph.get(from) ?? [])].sort()) {
      if (to.startsWith('shared/')) continue;
      lines.push(`  ${nodeId(from)} --> ${nodeId(to)}`);
    }
  }

  // blast 점선 엣지 (dedup).
  const seenBlast = new Set();
  for (const m of firstParty) {
    for (const s of [...(blast.get(m) ?? [])].sort()) {
      if (s === screen) continue;
      const edge = `  ${nodeId(m)} -.-> ${nodeId(s)}`;
      if (seenBlast.has(edge)) continue;
      seenBlast.add(edge);
      lines.push(edge);
    }
  }

  lines.push('```');
  lines.push('');
  lines.push('| 모듈 | 종류 | 방향 | 공의존 화면 |');
  lines.push('|---|---|---|---|');

  for (const m of firstParty) {
    const coDeps = [...(blast.get(m) ?? [])].sort();
    const coLabel = coDeps.length > 0 ? coDeps.join(', ') : screen;
    lines.push(`| ${m} | ${kindOf(m)} | 의존 | ${coLabel} |`);
  }
  for (const m of sharedMods) {
    const n = Math.max(0, (blast.get(m)?.size ?? 1) - 1);
    lines.push(`| ${m} | shared | 의존 | +${n} via shared |`);
  }

  return lines.join('\n');
}
