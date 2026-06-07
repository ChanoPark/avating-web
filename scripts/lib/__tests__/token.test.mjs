import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hasActiveToken } from '../token.mjs';

const dirs = [];
function makeDir() {
  const d = mkdtempSync(join(tmpdir(), 'wiki-token-'));
  dirs.push(d);
  return d;
}

afterEach(() => {
  while (dirs.length) {
    const d = dirs.pop();
    rmSync(d, { recursive: true, force: true });
  }
});

const now = () => Math.floor(Date.now() / 1000);

test('returns false when no token files exist', () => {
  const dir = makeDir();
  assert.equal(hasActiveToken(dir), false);
});

test('returns true for a fresh update token', () => {
  const dir = makeDir();
  writeFileSync(join(dir, '.wiki-edit-token.update'), `ts=${now()}\n`);
  assert.equal(hasActiveToken(dir), true);
});

test('returns false for an expired update token (>600s old)', () => {
  const dir = makeDir();
  writeFileSync(join(dir, '.wiki-edit-token.update'), `ts=${now() - 601}\n`);
  assert.equal(hasActiveToken(dir), false);
});

test('returns true for a fresh lint token (TTL 1200)', () => {
  const dir = makeDir();
  writeFileSync(join(dir, '.wiki-edit-token.lint'), `ts=${now() - 1000}\n`);
  assert.equal(hasActiveToken(dir), true);
});

test('returns false and ignores a malformed token (no ts)', () => {
  const dir = makeDir();
  writeFileSync(join(dir, '.wiki-edit-token.update'), 'garbage\n');
  assert.equal(hasActiveToken(dir), false);
});
