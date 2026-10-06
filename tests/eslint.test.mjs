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

// Like lint, but takes the factory output itself, so a test can change how the factory is called
// (no argument, string shorthand) or append a consumer config after it.
// Giống lint, nhưng nhận thẳng kết quả của factory, để test đổi được cách gọi factory
// (không tham số, chuỗi viết gọn) hoặc nối thêm config của consumer phía sau.
const lintWith = (code, file, config) =>
  new Linter({ configType: 'flat', cwd: CWD }).verify(code, [BASE, ...config], {
    filename: `${CWD}/${file}`,
  });

test('không truyền tham số hoặc truyền {} thì dùng preset rn-cli', () => {
  const code = "import { Text } from 'react-native';\nexport default Text;\n";
  for (const config of [uiStandard(), uiStandard({})]) {
    const [message] = lintWith(code, 'src/screens/Today/Today.jsx', config);
    assert.match(message.message, /@components\/Kit/);
  }
});

test('truyền chuỗi preset hoạt động như truyền { preset }', () => {
  const code = "import { Text } from 'react-native';\nexport default Text;\n";
  const [message] = lintWith(code, 'src/screens/Today/Today.jsx', uiStandard('expo-router'));
  assert.match(message.message, /@\/components\/Kit/);
});

test('react-native/no-unused-styles bắt entry StyleSheet không dùng ở màn', () => {
  const code = [
    "import { StyleSheet } from 'react-native';",
    'export const A = () => <Box style={styles.a} />;',
    'const styles = StyleSheet.create({ a: { flex: 1 }, b: { flex: 2 } });',
    '',
  ].join('\n');
  const unused = lint(code, 'src/screens/Today/Today.jsx').filter(
    m => m.ruleId === 'react-native/no-unused-styles',
  );
  assert.equal(unused.length, 1);
  assert.match(unused[0].message, /styles\.b/);
});

test('theme tắt react-native/no-color-literals', () => {
  const code = [
    "import { StyleSheet } from 'react-native';",
    'export const A = () => <Box style={styles.a} />;',
    "const styles = StyleSheet.create({ a: { color: 'red' } });",
    '',
  ].join('\n');
  assert.ok(rulesOf(lint(code, 'src/screens/Today/Today.jsx')).includes('react-native/no-color-literals'));
  assert.ok(!rulesOf(lint(code, 'src/theme/x.js')).includes('react-native/no-color-literals'));
});

test('bắt hex literal 3, 4 và 8 chữ số ở màn', () => {
  for (const hex of ['#FFF', '#FFFF', '#FFFFFFFF']) {
    const messages = lint(`export const c = '${hex}';\n`, 'src/screens/Today/Today.jsx');
    assert.ok(rulesOf(messages).includes('no-restricted-syntax'), hex);
  }
});

test('thông báo icon trỏ đúng đường dẫn Icon theo preset', () => {
  const code = "import Icon from '@expo/vector-icons';\nexport default Icon;\n";
  const [expo] = lint(code, 'src/screens/Today/Today.jsx', 'expo-router');
  const [cli] = lint(code, 'src/screens/Today/Today.jsx', 'rn-cli');
  assert.match(expo.message, /@\/components\/Icon/);
  assert.match(cli.message, /@components\/Icon/);
});

test('bảng tra gồm cả Icon, constants và theme: không cảnh báo max-lines', () => {
  const long = Array.from({ length: 260 }, (_, i) => `export const v${i} = ${i};`).join('\n');
  for (const file of ['src/components/Icon/Icon.js', 'src/constants/x.js', 'src/theme/x.js']) {
    assert.ok(!rulesOf(lint(long, file)).includes('max-lines'), file);
  }
});

test('Kit được import primitive react-native nhưng không được import thư viện icon', () => {
  const primitive = "import { View } from 'react-native';\nexport default View;\n";
  const icon = "import { Home } from 'lucide-react-native';\nexport default Home;\n";
  assert.deepEqual(lint(primitive, 'src/components/Kit/Box/index.jsx'), []);
  const violations = lint(icon, 'src/components/Kit/Box/index.jsx');
  assert.deepEqual(rulesOf(violations), ['no-restricted-imports']);
  assert.match(violations[0].message, /@\/components\/Icon/);
  assert.deepEqual(lint(icon, 'src/components/Icon/Icon.jsx'), []);
});

test('plugin react-native đăng ký toàn cục: consumer bật rule ngoài src không bị lỗi thiếu plugin', () => {
  const config = [
    ...uiStandard({ preset: 'expo-router' }),
    { files: ['**/*.js'], rules: { 'react-native/no-single-element-style-arrays': 'error' } },
  ];
  const code = 'export const A = () => <Box style={[styles.a]} />;\n';
  // Throws `Could not find plugin "react-native"` when the plugin is registered only for src/**.
  // Ném `Could not find plugin "react-native"` khi plugin chỉ được đăng ký cho src/**.
  const messages = lintWith(code, 'scripts/x.js', config);
  assert.ok(rulesOf(messages).includes('react-native/no-single-element-style-arrays'));
});

test('bắt import @react-native-vector-icons/ionicons ngoài module Icon', () => {
  const code = "import Ionicons from '@react-native-vector-icons/ionicons';\nexport default Ionicons;\n";
  assert.ok(rulesOf(lint(code, 'src/screens/Today/Today.jsx')).includes('no-restricted-imports'));
  assert.deepEqual(lint(code, 'src/components/Icon/Icon.jsx'), []);
});
