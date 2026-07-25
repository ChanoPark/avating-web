// token — wiki-edit-token 자기 검증. codemap write 게이트.
// update/lint 토큰 파일을 읽어 TTL 내 유효한 ts 가 있으면 true. 만료/무효 토큰은 즉시 제거.

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TTL = { update: 600, lint: 1200 };

/**
 * tokenDir 에 활성(TTL 내) wiki-edit-token 이 있는지 검사.
 * 만료·malformed 토큰 파일은 부수효과로 제거한다.
 * @param {string} tokenDir
 * @returns {boolean}
 */
export function hasActiveToken(tokenDir) {
  const now = Math.floor(Date.now() / 1000);
  for (const mode of ['update', 'lint']) {
    const file = join(tokenDir, `.wiki-edit-token.${mode}`);
    if (!existsSync(file)) continue;
    const content = readFileSync(file, 'utf8');
    const m = /^ts=(\d+)/m.exec(content);
    if (!m) {
      rmSync(file, { force: true });
      continue;
    }
    const ts = Number(m[1]);
    if (now - ts <= TTL[mode]) return true;
    rmSync(file, { force: true });
  }
  return false;
}
