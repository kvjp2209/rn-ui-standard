import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

// Same alias rule as the import-order checker: the alias itself or a sub-path of it.
// Cùng luật khớp alias với bộ kiểm thứ tự import: chính alias đó hoặc đường dẫn con của nó.
const matches = (path, alias) => path === alias || path.startsWith(`${alias}/`);
const matchesAny = (path, aliases) => aliases.some(alias => matches(path, alias));

for (const name of PRESET_NAMES) {
  test(`${name}: trường name trùng với tên file`, () => {
    assert.equal(loadPreset(name).name, name);
  });

  test(`${name}: imports.kit là một phần tử của importTiers.tier1`, () => {
    const { imports, importTiers } = loadPreset(name);
    assert.ok(importTiers.tier1.includes(imports.kit), `${imports.kit} không có trong tier1`);
  });

  test(`${name}: imports.icon thuộc tầng shared, không thuộc tier1/local/api/stores`, () => {
    const { imports, importTiers } = loadPreset(name);
    // Tiers the checker tests before "shared" must not claim the icon import.
    // Các tầng mà bộ kiểm xét trước "shared" không được nhận import icon.
    for (const tier of ['tier1', 'local', 'api', 'stores']) {
      assert.ok(
        !matchesAny(imports.icon, importTiers[tier]),
        `${imports.icon} bị khớp nhầm vào ${tier}`,
      );
    }
    assert.ok(
      matchesAny(imports.icon, importTiers.shared),
      `${imports.icon} không khớp alias nào trong shared`,
    );
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
test('expo-router: phần tử cuối của importTiers.shared là "@" để bắt mọi thư mục @/ chưa liệt kê', () => {
  const { shared } = loadPreset('expo-router').importTiers;
  assert.equal(shared.at(-1), '@');
});
