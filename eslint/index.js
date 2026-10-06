/**
 * Flat-config factory for the machine-checkable part of ui-standard.
 * Usage in eslint.config.js: `...require('rn-ui-standard/eslint')({ preset: 'expo-router' })`;
 * a bare string works too (`...require('rn-ui-standard/eslint')('expo-router')`), and with no
 * argument the preset is rn-cli.
 * Not enforceable here: the ≤5-prop threshold, the 4 data states, hitSlop and
 * the import pyramid (run rn-ui-check-imports for the last one).
 *
 * Factory flat config cho phần máy kiểm được của ui-standard.
 * Dùng trong eslint.config.js: `...require('rn-ui-standard/eslint')({ preset: 'expo-router' })`;
 * truyền chuỗi trần cũng được (`...require('rn-ui-standard/eslint')('expo-router')`), còn khi
 * không truyền gì thì preset là rn-cli.
 * Không chặn được ở đây: ngưỡng 5 prop, 4 trạng thái, hitSlop và kim tự tháp
 * import (cái cuối chạy rn-ui-check-imports).
 */
const fs = require('node:fs');
const path = require('node:path');
const reactNative = require('eslint-plugin-react-native');

const HEX_LITERAL = 'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]';
const RN_PRIMITIVES = ['View', 'Text', 'Image', 'ScrollView', 'TextInput', 'Pressable'];
// Icon libraries that must go through Icon; react-native-vector-icons >= 11 ships scoped
// packages (@react-native-vector-icons/ionicons, ...).
// Thư viện icon phải đi qua Icon; react-native-vector-icons >= 11 tách thành các package
// scoped (@react-native-vector-icons/ionicons, ...).
const ICON_LIBRARIES = [
  'react-native-vector-icons',
  'react-native-vector-icons/*',
  '@react-native-vector-icons/*',
  '@expo/vector-icons',
  '@expo/vector-icons/*',
  'lucide-react-native',
];
const SOURCE_FILES = ['src/**/*.{js,jsx,ts,tsx}'];
const FONT_SIZE_MESSAGE = 'Cấm fontSize hardcode — dùng variant T<cỡ><độ đậm>.';

const PRESETS_DIR = path.join(__dirname, '..', 'presets');

const loadPreset = name => {
  const available = fs
    .readdirSync(PRESETS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => file.slice(0, -'.json'.length))
    .sort();
  if (!/^[\w-]+$/.test(name) || !available.includes(name)) {
    throw new Error(
      `[rn-ui-standard] preset không tồn tại: ${name} (có: ${available.join(', ')})`,
    );
  }
  return JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, `${name}.json`), 'utf8'));
};

module.exports = function uiStandard(options = {}) {
  // A bare string is shorthand for { preset }.
  // Chuỗi trần là cách viết gọn của { preset }.
  const { preset = 'rn-cli' } = typeof options === 'string' ? { preset: options } : options;
  const { imports, paths } = loadPreset(preset);
  const iconPatterns = [
    { group: ICON_LIBRARIES, message: `Dùng <Icon name="..." /> từ ${imports.icon}.` },
  ];
  const lookupTables = [
    `${paths.locale}/**`,
    `${paths.icon}/**`,
    `${paths.theme}/**`,
    `${paths.constants}/**`,
    ...(paths.routeTypes ? [paths.routeTypes] : []),
  ];

  return [
    {
      // Registered for every file (no `files`) so a consumer can enable react-native/* rules
      // outside src/** without "Could not find plugin"; registering a plugin enables no rule.
      // Đăng ký cho mọi file (không có `files`) để consumer bật được rule react-native/* ngoài
      // src/** mà không bị "Could not find plugin"; đăng ký plugin không tự bật rule nào.
      name: 'rn-ui-standard/plugins',
      plugins: { 'react-native': reactNative },
    },
    {
      name: 'rn-ui-standard/rules',
      files: SOURCE_FILES,
      rules: {
        'react-native/no-color-literals': 'error',
        'react-native/no-inline-styles': 'error',
        'react-native/no-unused-styles': 'error',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native',
                importNames: RN_PRIMITIVES,
                message: `Dùng Kit (Box, Text, Image, ScrollView, TextInput, Pressable) từ ${imports.kit}.`,
              },
            ],
            patterns: iconPatterns,
          },
        ],
        'no-restricted-syntax': [
          'error',
          {
            selector: HEX_LITERAL,
            message: 'Cấm hex literal — dùng token semantic ($surface, $text…).',
          },
          { selector: "JSXAttribute[name.name='fontSize']", message: FONT_SIZE_MESSAGE },
          {
            selector: "Property[key.name='fontSize'][value.type='Literal']",
            message: FONT_SIZE_MESSAGE,
          },
        ],
        'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
      },
    },
    {
      // Kit wraps the primitives, so it may import them; icon libraries still go through Icon.
      // Kit bọc primitive nên được import chúng; thư viện icon vẫn phải đi qua Icon.
      name: 'rn-ui-standard/kit',
      files: [`${paths.kit}/**`],
      rules: { 'no-restricted-imports': ['error', { patterns: iconPatterns }] },
    },
    {
      // Icon wraps the icon libraries (and the primitives), so it may import them.
      // Icon bọc thư viện icon (và cả primitive) nên được import chúng.
      name: 'rn-ui-standard/icon',
      files: [`${paths.icon}/**`],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      // Palette and theme are where raw values live.
      // Palette và theme là nơi chứa giá trị raw.
      name: 'rn-ui-standard/theme',
      files: [`${paths.theme}/**`],
      rules: { 'react-native/no-color-literals': 'off', 'no-restricted-syntax': 'off' },
    },
    {
      // Lookup tables: length grows with entries, not with branching.
      // Bảng tra: dài theo số mục, không theo số nhánh.
      name: 'rn-ui-standard/lookup-tables',
      files: lookupTables,
      rules: { 'max-lines': 'off' },
    },
  ];
};
