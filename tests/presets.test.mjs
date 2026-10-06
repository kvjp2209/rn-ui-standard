import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { tierOf } from '../skills/ui-standard/scripts/import-order-lib.mjs';

// Invariants every preset in presets/*.json must satisfy.
// Các bất biến mà mọi preset trong presets/*.json phải thỏa mãn.

// Preset names under test; each needs a presets/<name>.json file.
// Tên các preset cần kiểm; mỗi tên cần có file presets/<name>.json.
const PRESET_NAMES = ['rn-cli', 'expo-router'];

// Router values a preset may declare.
// Các giá trị router mà preset được phép khai báo.
const ROUTERS = ['react-navigation', 'expo-router'];

// Reads and parses presets/<name>.json, resolved relative to this test file.
// Đọc và parse presets/<name>.json, đường dẫn tính từ file test này.
const loadPreset = name =>
  JSON.parse(readFileSync(new URL(`../presets/${name}.json`, import.meta.url), 'utf8'));

for (const name of PRESET_NAMES) {
  test(`${name}: trường name trùng với tên file`, () => {
    assert.equal(loadPreset(name).name, name);
  });

  // Each preset must define exactly these keys in paths, imports and importTiers.
  // Mỗi preset phải khai báo đúng các khoá này trong paths, imports và importTiers.
  test(`${name}: đủ khoá bắt buộc`, () => {
    const { paths, imports, importTiers } = loadPreset(name);
    assert.deepEqual(Object.keys(paths).sort(), [
      'constants',
      'icon',
      'kit',
      'locale',
      'routeTypes',
      'theme',
    ]);
    assert.deepEqual(Object.keys(imports).sort(), ['icon', 'kit']);
    assert.deepEqual(Object.keys(importTiers).sort(), [
      'api',
      'local',
      'shared',
      'stores',
      'tier1',
    ]);
  });

  // tierOf is the checker's own logic, so this test cannot drift from it.
  // tierOf là chính logic của bộ kiểm, nên test này không thể lệch khỏi nó.
  test(`${name}: imports.kit rơi vào tầng 1 theo bộ kiểm`, () => {
    const { imports, importTiers } = loadPreset(name);
    assert.equal(tierOf(imports.kit, importTiers), 1, `${imports.kit} không rơi vào tầng 1`);
  });

  test(`${name}: imports.icon thuộc tầng shared, không thuộc tier1/local/api/stores`, () => {
    const { imports, importTiers } = loadPreset(name);
    // tierOf tests tier1, local, api, stores before "shared": tier 3 means none took the icon.
    // tierOf xét tier1, local, api, stores trước "shared": ra tầng 3 nghĩa là không tầng nào nhận icon.
    assert.equal(tierOf(imports.icon, importTiers), 3, `${imports.icon} không rơi vào tầng 3`);
  });

  test(`${name}: mọi paths.* là null (chỉ routeTypes) hoặc đường dẫn bắt đầu bằng src/`, () => {
    for (const [key, value] of Object.entries(loadPreset(name).paths)) {
      if (value === null) {
        assert.equal(key, 'routeTypes', `paths.${key} không được là null`);
        continue;
      }
      assert.equal(typeof value, 'string', `paths.${key} phải là chuỗi`);
      assert.ok(value.startsWith('src/'), `paths.${key} phải bắt đầu bằng "src/": ${value}`);
      assert.ok(!value.startsWith('/'), `paths.${key} không được bắt đầu bằng "/": ${value}`);
    }
  });

  test(`${name}: router hợp lệ và reactCompiler là boolean`, () => {
    const { router, reactCompiler } = loadPreset(name);
    assert.ok(ROUTERS.includes(router), `router không hợp lệ: ${router}`);
    assert.equal(typeof reactCompiler, 'boolean');
  });
}

// Without a catch-all "@", unlisted folders such as @/types/x fall into tier 2 (third-party).
// Không có catch-all "@" thì các thư mục chưa liệt kê như @/types/x bị xếp vào tầng 2 (thư viện ngoài).
test('expo-router: importTiers.shared có "@" để bắt mọi thư mục @/ chưa liệt kê', () => {
  const { shared } = loadPreset('expo-router').importTiers;
  assert.ok(shared.includes('@'), 'importTiers.shared thiếu "@"');
});
