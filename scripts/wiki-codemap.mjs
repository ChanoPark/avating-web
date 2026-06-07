#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildForwardGraph, renderCodemapBlock } from './lib/codemap-core.mjs';
import { hasActiveToken } from './lib/token.mjs';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const CHECK = process.argv.includes('--check');
const SCREENS_DIR = join(REPO, '.claude/wiki/screens');
// 마커 그룹은 개행을 소비하지 않음 → 빈 스캐폴드(start-->\n<!-- codemap:end -->)도 매칭. 교체 시 개행 정규화.
const MARKER_RE = /(<!-- codemap:start screen=([a-z0-9-]+)[^>]*-->)([\s\S]*?)(<!-- codemap:end -->)/;

function listScreens() {
  const base = join(REPO, 'src/pages');
  return readdirSync(base)
    .filter((n) => statSync(join(base, n)).isDirectory())
    .sort();
}
function runDepcruise() {
  const out = execFileSync(
    'pnpm',
    ['exec', 'depcruise', '--config', 'dependency-cruiser.config.cjs', '--output-type', 'json', 'src'],
    { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  return JSON.parse(out);
}
function main() {
  if (!CHECK && !hasActiveToken(join(REPO, '.claude'))) {
    console.error('codemap write 거부: .claude/.wiki-edit-token.update|lint 비활성');
    process.exit(1);
  }
  const screens = listScreens();
  const graph = buildForwardGraph(runDepcruise());
  const stale = [];
  for (const screen of screens) {
    const file = join(SCREENS_DIR, `${screen}.md`);
    if (!existsSync(file)) continue;
    const src = readFileSync(file, 'utf8');
    if (!MARKER_RE.test(src)) continue;
    const block = renderCodemapBlock(graph, screen, screens);
    const next = src.replace(MARKER_RE, `$1\n${block}\n$4`);
    if (next === src) continue;
    if (CHECK) stale.push(screen);
    else writeFileSync(file, next);
  }
  if (CHECK && stale.length) {
    console.error(`codemap-drift: ${stale.join(', ')}`);
    process.exit(stale.length);
  }
  console.log(CHECK ? 'codemap check: green' : `codemap write: ${screens.length} screens`);
}
main();
