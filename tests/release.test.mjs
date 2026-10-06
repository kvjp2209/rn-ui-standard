import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Read a JSON file relative to the repo root.
// Đọc file JSON tính từ gốc repo.
const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

// The message names the file that disagrees with package.json.
// Thông điệp nêu tên file đang lệch so với package.json.
test('version của package, lockfile, plugin và marketplace khớp nhau', () => {
  const { version } = read('package.json');
  const lock = read('package-lock.json');
  const marketplace = read('.claude-plugin/marketplace.json');
  assert.equal(lock.version, version, 'package-lock.json: version');
  assert.equal(lock.packages[''].version, version, 'package-lock.json: packages[""].version');
  assert.equal(read('.claude-plugin/plugin.json').version, version, 'plugin.json: version');
  assert.equal(marketplace.metadata.version, version, 'marketplace.json: metadata.version');
  assert.deepEqual(
    marketplace.plugins.map(plugin => plugin.version),
    [version],
    'marketplace.json: plugins[].version',
  );
});
