import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Read a JSON file relative to the repo root.
// Đọc file JSON tính từ gốc repo.
const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('version của package, plugin và marketplace khớp nhau', () => {
  const { version } = read('package.json');
  const marketplace = read('.claude-plugin/marketplace.json');
  assert.equal(read('.claude-plugin/plugin.json').version, version);
  assert.equal(marketplace.metadata.version, version);
  assert.deepEqual(
    marketplace.plugins.map(plugin => plugin.version),
    [version],
  );
});
