import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
const LIB = fileURLToPath(
  new URL('../skills/ui-standard/scripts/import-order-lib.mjs', import.meta.url),
);

// Every project dir made by makeProject, removed once this file's tests are done.
// Mọi thư mục dự án do makeProject tạo, được xoá khi các test trong file này chạy xong.
const tempDirs = [];
after(() => {
  tempDirs.forEach(dir => rmSync(dir, { recursive: true, force: true }));
});

const makeProject = overlay => {
  const dir = mkdtempSync(join(tmpdir(), 'rn-ui-standard-'));
  tempDirs.push(dir);
  if (overlay !== undefined) {
    mkdirSync(join(dir, 'docs/ui-standard'), { recursive: true });
    writeFileSync(join(dir, 'docs/ui-standard/project.md'), overlay);
  }
  return dir;
};

// Runs the CLI through `node` as a child process from `cwd`.
// Chạy CLI qua `node` như một tiến trình con tại `cwd`.
const runCli = (args, cwd) =>
  spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });

// Copies the lib next to a presets/ dir holding only `files` ({ file name: content }) and imports
// that copy, so the loader can be tested against presets other than the shipped ones.
// Sao lib cạnh một thư mục presets/ chỉ chứa `files` ({ tên file: nội dung }) rồi import bản sao,
// để thử bộ nạp preset với những preset khác bộ có sẵn.
const importLibWithPresets = async files => {
  const root = makeProject();
  const scripts = join(root, 'skills/ui-standard/scripts');
  mkdirSync(scripts, { recursive: true });
  mkdirSync(join(root, 'presets'));
  copyFileSync(LIB, join(scripts, 'import-order-lib.mjs'));
  Object.entries(files).forEach(([name, content]) => {
    writeFileSync(join(root, 'presets', name), content);
  });
  return import(pathToFileURL(join(scripts, 'import-order-lib.mjs')).href);
};

// Everything a CLI run left behind, used as the assertion message so a crash or a spawn failure
// (e.g. a missing exec bit) shows up in the report.
// Mọi thứ một lần chạy CLI để lại, làm thông điệp assert để thấy được khi CLI sập hoặc không khởi
// chạy được (vd thiếu bit thực thi).
const outputOf = result =>
  `stdout:\n${result.stdout}\nstderr:\n${result.stderr}\nspawn error: ${result.error ?? 'none'}`;

const EXPO_OVERLAY = '---\npreset: expo-router\nreact-compiler: true\n---\n\n# Overlay\n';

// Front matter spellings that must all resolve to expo-router.
// Các cách viết front matter đều phải ra expo-router.
const EXPO_OVERLAY_VARIANTS = {
  'có nháy kép': '---\npreset: "expo-router"\n---\n',
  'có nháy đơn': "---\npreset: 'expo-router'\n---\n",
  'có chú thích cuối dòng': '---\npreset: expo-router # preset cho Expo Router\n---\n',
  'có BOM ở đầu file': '\uFEFF---\npreset: expo-router\n---\n',
  'xuống dòng kiểu CRLF': '---\r\npreset: expo-router\r\n---\r\n\r\n# Overlay\r\n',
  'có dấu cách thừa sau dòng --- mở đầu': '--- \npreset: expo-router\n---\n',
  'có dấu cách và tab thừa sau dòng --- đóng': '---\npreset: expo-router\n---  \t\n\n# Overlay\n',
  'có dấu cách trước dấu hai chấm': '---\npreset : expo-router\n---\n',
};

// `preset:` lines that cannot be read: they must raise an error, not fall back silently.
// Các dòng `preset:` không đọc được: phải báo lỗi chứ không lặng lẽ dùng mặc định.
const MALFORMED_PRESET_LINES = [
  'preset: expo router',
  'preset : expo router',
  'preset:',
  'preset :',
  'preset: "expo-router',
  'preset: ../package',
];

// The 1.1 DEFAULT_CONFIG, frozen as it was in check-import-order.mjs at f7210b4.
// DEFAULT_CONFIG của bản 1.1, giữ nguyên như trong check-import-order.mjs ở f7210b4.
const DEFAULT_CONFIG_1_1 = {
  tier1: ['react', 'react-native', '@components/Kit'],
  shared: [
    '@app',
    '@assets',
    '@components',
    '@constants',
    '@hooks',
    '@libs',
    '@locale',
    '@modules',
    '@navigation',
    '@theme',
    '@utils',
    '@src',
  ],
  local: ['@src/screens'],
  api: ['@api'],
  stores: ['@stores'],
};

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

test('preset rn-cli giữ đúng cấu hình tầng mặc định của 1.1', () => {
  assert.deepEqual(loadPreset('rn-cli').importTiers, DEFAULT_CONFIG_1_1);
});

test('đọc preset từ front matter của overlay', () => {
  const dir = makeProject(EXPO_OVERLAY);
  assert.equal(readOverlayPreset(dir), 'expo-router');
  assert.equal(resolveConfig([], dir).presetName, 'expo-router');
});

for (const [label, overlay] of Object.entries(EXPO_OVERLAY_VARIANTS)) {
  test(`overlay ${label} vẫn đọc ra expo-router`, () => {
    const dir = makeProject(overlay);
    assert.equal(readOverlayPreset(dir), 'expo-router');
    assert.equal(resolveConfig([], dir).presetName, 'expo-router');
  });
}

test('overlay không có front matter thì trả null', () => {
  assert.equal(readOverlayPreset(makeProject('# Overlay\n\npreset: expo-router\n')), null);
});

test('front matter không có khoá preset thì trả null', () => {
  assert.equal(readOverlayPreset(makeProject('---\nreact-compiler: true\n---\n')), null);
  // A `preset:` line below the front matter does not count.
  // Dòng `preset:` nằm dưới front matter thì không tính.
  const body = '---\nreact-compiler: true\n---\npreset: expo-router\n';
  assert.equal(readOverlayPreset(makeProject(body)), null);
  // Other keys that merely start with "preset" are not the preset key.
  // Các khoá khác chỉ bắt đầu bằng "preset" thì không phải khoá preset.
  const lookalikes = '---\npresets: expo-router\npreset-name: expo-router\n---\n';
  assert.equal(readOverlayPreset(makeProject(lookalikes)), null);
});

test('front matter không có dòng đóng --- thì trả null', () => {
  assert.equal(readOverlayPreset(makeProject('---\npreset: expo-router\n')), null);
});

test('dòng preset sai cú pháp thì báo lỗi chứ không bỏ qua im lặng', () => {
  for (const line of MALFORMED_PRESET_LINES) {
    const dir = makeProject(`---\n${line}\n---\n`);
    assert.throws(
      () => readOverlayPreset(dir),
      error => error.message.includes('preset') && error.message.includes(line),
      `dòng này phải gây lỗi: ${line}`,
    );
  }
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

test('--preset rn-cli kèm --config thì --config ghi đè từng khoá lên rn-cli', () => {
  const dir = makeProject(EXPO_OVERLAY);
  const configPath = join(dir, 'tiers.json');
  writeFileSync(configPath, JSON.stringify({ stores: ['@state'] }));
  const { config, presetName } = resolveConfig(['--preset', 'rn-cli', '--config', configPath], dir);
  assert.equal(presetName, 'rn-cli');
  assert.deepEqual(config, { ...loadPreset('rn-cli').importTiers, stores: ['@state'] });
});

test('--preset=expo-router (dạng có dấu =) cũng dùng được', () => {
  const { presetName, targets } = resolveConfig(['--preset=expo-router', 'app'], makeProject());
  assert.equal(presetName, 'expo-router');
  assert.deepEqual(targets, ['app']);
});

test('--config=<file> (dạng có dấu =) cũng dùng được', () => {
  const dir = makeProject();
  const configPath = join(dir, 'tiers.json');
  writeFileSync(configPath, JSON.stringify({ stores: ['@state'] }));
  const { config } = resolveConfig([`--config=${configPath}`], dir);
  assert.deepEqual(config.stores, ['@state']);
});

test('--config đường dẫn tương đối được tính từ cwd truyền vào', () => {
  const dir = makeProject();
  writeFileSync(join(dir, 'tiers.json'), JSON.stringify({ api: ['@services'] }));
  const { config } = resolveConfig(['--config', 'tiers.json'], dir);
  assert.deepEqual(config.api, ['@services']);
});

test('thiếu giá trị sau --config hoặc --preset thì báo lỗi', () => {
  const dir = makeProject();
  assert.throws(() => resolveConfig(['--config'], dir), /--config/);
  assert.throws(() => resolveConfig(['--preset'], dir), /--preset/);
});

test('tuỳ chọn lạ thì báo lỗi thay vì bị coi là đích kiểm', () => {
  assert.throws(() => resolveConfig(['--khong-co'], makeProject()), /--khong-co/);
});

test('không truyền đích thì kiểm src', () => {
  assert.deepEqual(resolveConfig([], makeProject()).targets, ['src']);
});

test('preset không tồn tại thì báo lỗi rõ', () => {
  assert.throws(() => loadPreset('khong-co'), /khong-co/);
  assert.throws(() => loadPreset('khong-co'), /\(có: expo-router, rn-cli\)/);
});

test('danh sách preset có sẵn lấy từ thư mục presets/, chỉ tính file .json và đã sắp xếp', async () => {
  const lib = await importLibWithPresets({
    'b-preset.json': JSON.stringify({ importTiers: {} }),
    'a-preset.json': JSON.stringify({ importTiers: {} }),
    'ghi-chu.txt': 'không phải preset',
  });
  assert.throws(() => lib.loadPreset('khong-co'), /\(có: a-preset, b-preset\)/);
});

test('preset thiếu importTiers thì báo lỗi rõ', async () => {
  const lib = await importLibWithPresets({ 'hong.json': JSON.stringify({ name: 'hong' }) });
  assert.throws(() => lib.loadPreset('hong'), /hong.*importTiers/);
});

test('tên preset chứa đường dẫn hoặc rỗng thì bị từ chối, không đọc file ngoài presets/', () => {
  const dir = makeProject();
  assert.throws(() => loadPreset('../package'), /preset không tồn tại: \.\.\/package/);
  assert.throws(
    () => resolveConfig(['--preset', '../package'], dir),
    /preset không tồn tại: \.\.\/package/,
  );
  assert.throws(() => resolveConfig(['--preset='], dir), /preset không tồn tại/);
});

test('preset ghi trong overlay mà không tồn tại thì lỗi chỉ rõ nguồn là overlay', () => {
  const dir = makeProject('---\npreset: khong-co\n---\n');
  assert.throws(
    () => resolveConfig([], dir),
    /khong-co.*\(đọc từ docs\/ui-standard\/project\.md\)/,
  );
});

test('preset truyền bằng --preset mà không tồn tại thì lỗi không nhắc tới overlay', () => {
  const dir = makeProject(EXPO_OVERLAY);
  assert.throws(
    () => resolveConfig(['--preset', 'khong-co'], dir),
    error => error.message.includes('khong-co') && !error.message.includes('đọc từ'),
  );
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
  const result = runCli([], dir);
  assert.equal(result.status, 0, outputOf(result));
});

test('CLI thoát mã 1 khi có vi phạm', () => {
  const dir = makeProject(EXPO_OVERLAY);
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src/Bad.tsx'), "import { Stack } from 'expo-router';\nimport { Box } from '@/components/Kit';\n");
  const result = runCli([], dir);
  assert.equal(result.status, 1, outputOf(result));
  assert.match(result.stdout, /\[luật 1\]/, outputOf(result));
});

test('CLI thoát mã 2, báo lỗi ở stderr và để trống stdout khi preset không tồn tại', () => {
  const dir = makeProject();
  mkdirSync(join(dir, 'src'));
  const result = runCli(['--preset', 'khong-co'], dir);
  assert.equal(result.status, 2, outputOf(result));
  assert.match(result.stderr, /khong-co/, outputOf(result));
  assert.equal(result.stdout, '', outputOf(result));
});

// A usage error prints its message only: no stack frame (`    at ...`) may reach stderr.
// Lỗi cách dùng chỉ in thông điệp: stderr không được lọt dòng stack (`    at ...`).
const STACK_LINE = /\n\s+at /;

test('CLI thoát mã 2, chỉ in thông điệp (không stack) khi đích kiểm không tồn tại', () => {
  const result = runCli(['nope-dir'], makeProject());
  assert.equal(result.status, 2, outputOf(result));
  assert.match(result.stderr, /nope-dir/, outputOf(result));
  assert.doesNotMatch(result.stderr, STACK_LINE, outputOf(result));
  assert.equal(result.stdout, '', outputOf(result));
});

test('CLI thoát mã 2, chỉ in thông điệp (không stack) khi file --config không phải JSON', () => {
  const dir = makeProject();
  writeFileSync(join(dir, 'bad.json'), '{ không phải JSON');
  const result = runCli(['--config', 'bad.json'], dir);
  assert.equal(result.status, 2, outputOf(result));
  assert.match(result.stderr, /--config/, outputOf(result));
  assert.match(result.stderr, /bad\.json/, outputOf(result));
  assert.doesNotMatch(result.stderr, STACK_LINE, outputOf(result));
  assert.equal(result.stdout, '', outputOf(result));
});

test('CLI thoát mã 2, nêu rõ --config và tên file khi file --config không tồn tại', () => {
  const result = runCli(['--config', 'thieu.json'], makeProject());
  assert.equal(result.status, 2, outputOf(result));
  assert.match(result.stderr, /--config/, outputOf(result));
  assert.match(result.stderr, /thieu\.json/, outputOf(result));
  assert.doesNotMatch(result.stderr, STACK_LINE, outputOf(result));
  assert.equal(result.stdout, '', outputOf(result));
});

// Test options for spawning a shebang script directly, which only works on POSIX.
// Tuỳ chọn cho test chạy trực tiếp một script có shebang, chỉ dùng được trên POSIX.
const POSIX_ONLY = { skip: process.platform === 'win32' && 'chỉ áp dụng trên POSIX' };

// The bin symlink itself is spawned, as yarn/npm users run it, so the shebang and the exec bit are
// covered too. PATH gets this Node's directory so `#!/usr/bin/env node` finds the same Node.
// Chính symlink bin được chạy, như người dùng yarn/npm, nên shebang và bit thực thi cũng được phủ.
// PATH được thêm thư mục của Node đang chạy để `#!/usr/bin/env node` tìm đúng Node này.
test('CLI chạy được qua symlink node_modules/.bin như khi yarn/npm cài bin', POSIX_ONLY, () => {
  const dir = makeProject(EXPO_OVERLAY);
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src/Ok.tsx'), EXPO_OK);
  mkdirSync(join(dir, 'node_modules/.bin'), { recursive: true });
  const link = join(dir, 'node_modules/.bin/rn-ui-check-imports');
  symlinkSync(CLI, link);
  const PATH = `${dirname(process.execPath)}${delimiter}${process.env.PATH ?? ''}`;
  const result = spawnSync(link, [], { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH } });
  assert.equal(result.status, 0, outputOf(result));
  // Exit 0 alone could mean "found nothing": the file must really have been scanned.
  // Mã thoát 0 một mình có thể là "không thấy gì": file phải thật sự được quét.
  assert.match(result.stdout, /0 vi phạm ở 0\/1 file/, outputOf(result));
});
