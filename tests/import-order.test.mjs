import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  tierOf,
  checkFile,
  loadPreset,
  resolveConfig,
  readOverlayPreset,
} from '../skills/ui-standard/scripts/import-order-lib.mjs';

const CLI = fileURLToPath(
  new URL('../skills/ui-standard/scripts/check-import-order.mjs', import.meta.url),
);

const makeProject = overlay => {
  const dir = mkdtempSync(join(tmpdir(), 'rn-ui-standard-'));
  if (overlay !== undefined) {
    mkdirSync(join(dir, 'docs/ui-standard'), { recursive: true });
    writeFileSync(join(dir, 'docs/ui-standard/project.md'), overlay);
  }
  return dir;
};

const EXPO_OVERLAY = '---\npreset: expo-router\nreact-compiler: true\n---\n\n# Overlay\n';

const EXPO_OK = [
  "import { memo } from 'react';",
  "import { Box, Text } from '@/components/Kit';",
  '',
  "import { useTranslation } from 'react-i18next';",
  '',
  "import { useTheme } from '@/theme';",
  '',
  "import { getBookingsAPI } from '@/api/bookings/bookings.api';",
  '',
  "import { useSessionStore } from '@/stores/session';",
  '',
  "import BookingRow from './components/BookingRow';",
  '',
  'export default memo(BookingRow);',
  '',
].join('\n');

test('không có overlay thì dùng preset rn-cli như 1.1', () => {
  const { presetName, config } = resolveConfig([], makeProject());
  assert.equal(presetName, 'rn-cli');
  assert.deepEqual(config, loadPreset('rn-cli').importTiers);
});

test('đọc preset từ front matter của overlay', () => {
  const dir = makeProject(EXPO_OVERLAY);
  assert.equal(readOverlayPreset(dir), 'expo-router');
  assert.equal(resolveConfig([], dir).presetName, 'expo-router');
});

test('overlay không có front matter thì trả null', () => {
  assert.equal(readOverlayPreset(makeProject('# Overlay\n\npreset: expo-router\n')), null);
});

test('--preset thắng front matter', () => {
  const dir = makeProject(EXPO_OVERLAY);
  assert.equal(resolveConfig(['--preset', 'rn-cli'], dir).presetName, 'rn-cli');
});

test('--config ghi đè từng khoá lên preset đã chọn', () => {
  const dir = makeProject(EXPO_OVERLAY);
  const configPath = join(dir, 'tiers.json');
  writeFileSync(configPath, JSON.stringify({ stores: ['@/state'] }));
  const { config, targets } = resolveConfig(['--config', configPath, 'app'], dir);
  assert.deepEqual(config.stores, ['@/state']);
  assert.deepEqual(config.api, ['@/api']);
  assert.deepEqual(targets, ['app']);
});

test('không truyền đích thì kiểm src', () => {
  assert.deepEqual(resolveConfig([], makeProject()).targets, ['src']);
});

test('preset không tồn tại thì báo lỗi rõ', () => {
  assert.throws(() => loadPreset('khong-co'), /khong-co/);
});

test('tầng theo preset expo-router', () => {
  const tiers = loadPreset('expo-router').importTiers;
  assert.equal(tierOf('react', tiers), 1);
  assert.equal(tierOf('@/components/Kit', tiers), 1);
  assert.equal(tierOf('expo-router', tiers), 2);
  assert.equal(tierOf('react-native-safe-area-context', tiers), 2);
  assert.equal(tierOf('@/theme', tiers), 3);
  assert.equal(tierOf('@/components/AppProviders', tiers), 3);
  assert.equal(tierOf('@/types/booking', tiers), 3);
  assert.equal(tierOf('@shopify/restyle', tiers), 2);
  assert.equal(tierOf('@/api/bookings/bookings.api', tiers), 4);
  assert.equal(tierOf('@/stores/session', tiers), 5);
  assert.equal(tierOf('@/screens/Today', tiers), 6);
  assert.equal(tierOf('./components/Row', tiers), 6);
});

test('file đúng khuôn expo-router không có vi phạm', () => {
  assert.deepEqual(checkFile(EXPO_OK, loadPreset('expo-router').importTiers), []);
});

test('cùng file đó đọc bằng preset rn-cli thì có vi phạm', () => {
  assert.ok(checkFile(EXPO_OK, loadPreset('rn-cli').importTiers).length > 0);
});

test('CLI đọc preset từ overlay ở cwd và thoát mã 0 khi sạch', () => {
  const dir = makeProject(EXPO_OVERLAY);
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src/Ok.tsx'), EXPO_OK);
  const result = spawnSync(process.execPath, [CLI], { cwd: dir, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout);
});

test('CLI thoát mã 1 khi có vi phạm', () => {
  const dir = makeProject(EXPO_OVERLAY);
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src/Bad.tsx'), "import { Stack } from 'expo-router';\nimport { Box } from '@/components/Kit';\n");
  const result = spawnSync(process.execPath, [CLI], { cwd: dir, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[luật 1\]/);
});
