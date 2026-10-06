import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const uiStandard = require('../eslint/index.js');

const CWD = '/project';
const BASE = {
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
};

const lint = (code, file, preset = 'expo-router') =>
  new Linter({ configType: 'flat', cwd: CWD }).verify(
    code,
    [BASE, ...uiStandard({ preset })],
    { filename: `${CWD}/${file}` },
  );

const rulesOf = messages => messages.map(m => m.ruleId);

test('cấm primitive react-native ngoài Kit, cho phép trong Kit', () => {
  const code = "import { View } from 'react-native';\nexport default View;\n";
  assert.ok(rulesOf(lint(code, 'src/screens/Today/Today.jsx')).includes('no-restricted-imports'));
  assert.deepEqual(lint(code, 'src/components/Kit/Box/index.jsx'), []);
});

test('thông báo trỏ đúng đường dẫn Kit theo preset', () => {
  const code = "import { Text } from 'react-native';\nexport default Text;\n";
  const [expo] = lint(code, 'src/screens/Today/Today.jsx', 'expo-router');
  const [cli] = lint(code, 'src/screens/Today/Today.jsx', 'rn-cli');
  assert.match(expo.message, /@\/components\/Kit/);
  assert.match(cli.message, /@components\/Kit/);
});

test('cấm import thư viện icon ngoài module Icon', () => {
  for (const source of ['@expo/vector-icons', 'lucide-react-native', 'react-native-vector-icons/Ionicons']) {
    const code = `import Icon from '${source}';\nexport default Icon;\n`;
    assert.ok(rulesOf(lint(code, 'src/screens/Today/Today.jsx')).includes('no-restricted-imports'), source);
    assert.deepEqual(lint(code, 'src/components/Icon/Icon.jsx'), [], source);
  }
});

test('cấm hex literal ngoài theme, cho phép trong theme', () => {
  const code = "export const c = '#FFFFFF';\n";
  assert.ok(rulesOf(lint(code, 'src/screens/Today/Today.jsx')).includes('no-restricted-syntax'));
  assert.deepEqual(lint(code, 'src/theme/palette.js'), []);
});

test('cấm fontSize hardcode ở prop JSX và trong object', () => {
  const jsx = 'export const A = () => <Label fontSize={14} />;\n';
  const object = 'export const s = { fontSize: 14 };\n';
  assert.ok(rulesOf(lint(jsx, 'src/screens/Today/Today.jsx')).includes('no-restricted-syntax'));
  assert.ok(rulesOf(lint(object, 'src/screens/Today/Today.jsx')).includes('no-restricted-syntax'));
});

test('bắt inline style và color literal của react-native', () => {
  const inline = 'export const A = () => <Box style={{ flex: 1 }} />;\n';
  const color = [
    "import { StyleSheet } from 'react-native';",
    'export const A = () => <Box style={styles.a} />;',
    "const styles = StyleSheet.create({ a: { color: 'red' } });",
    '',
  ].join('\n');
  assert.ok(rulesOf(lint(inline, 'src/screens/Today/Today.jsx')).includes('react-native/no-inline-styles'));
  assert.ok(rulesOf(lint(color, 'src/screens/Today/Today.jsx')).includes('react-native/no-color-literals'));
});

test('max-lines cảnh báo ở màn, miễn ở bảng tra', () => {
  const long = Array.from({ length: 260 }, (_, i) => `export const v${i} = ${i};`).join('\n');
  const screen = lint(long, 'src/screens/Today/Today.jsx');
  assert.ok(screen.some(m => m.ruleId === 'max-lines' && m.severity === 1));
  assert.deepEqual(lint(long, 'src/locale/vi.js'), []);
});

test('file kiểu route chỉ miễn max-lines ở preset rn-cli', () => {
  const long = Array.from({ length: 260 }, (_, i) => `export const v${i} = ${i};`).join('\n');
  assert.deepEqual(lint(long, 'src/navigation/types.ts', 'rn-cli'), []);
  assert.ok(rulesOf(lint(long, 'src/navigation/types.ts', 'expo-router')).includes('max-lines'));
});

test('file ngoài src không bị áp luật', () => {
  const code = "export const c = '#FFFFFF';\n";
  const messages = lint(code, 'app.config.js');
  assert.ok(messages.every(m => m.ruleId !== 'no-restricted-syntax'));
});

test('preset không tồn tại thì báo lỗi rõ', () => {
  assert.throws(() => uiStandard({ preset: 'khong-co' }), /khong-co/);
});

// A name that is not a plain shipped preset (e.g. ../package) is rejected, and the error lists the available presets.
// Tên không phải preset có sẵn (vd ../package) bị chặn, và lỗi liệt kê các preset hiện có.
test('tên preset sai định dạng bị chặn, lỗi liệt kê preset có sẵn', () => {
  assert.throws(() => uiStandard({ preset: '../package' }), /preset không tồn tại: \.\.\/package \(có: expo-router, rn-cli\)/);
});
