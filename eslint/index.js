/**
 * Flat-config factory for the machine-checkable part of ui-standard.
 * Usage in eslint.config.js: `...require('rn-ui-standard/eslint')({ preset: 'expo-router' })`.
 * Not enforceable here: the ≤5-prop threshold, the 4 data states, hitSlop and
 * the import pyramid (run rn-ui-check-imports for the last one).
 *
 * Factory flat config cho phần máy kiểm được của ui-standard.
 * Dùng trong eslint.config.js: `...require('rn-ui-standard/eslint')({ preset: 'expo-router' })`.
 * Không chặn được ở đây: ngưỡng 5 prop, 4 trạng thái, hitSlop và kim tự tháp
 * import (cái cuối chạy rn-ui-check-imports).
 */
const fs = require('node:fs');
const path = require('node:path');
const reactNative = require('eslint-plugin-react-native');

const HEX_LITERAL = 'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]';
const RN_PRIMITIVES = ['View', 'Text', 'Image', 'ScrollView', 'TextInput', 'Pressable'];
const ICON_LIBRARIES = [
  'react-native-vector-icons',
  'react-native-vector-icons/*',
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

module.exports = function uiStandard({ preset = 'rn-cli' } = {}) {
  const { imports, paths } = loadPreset(preset);
  const lookupTables = [
    `${paths.locale}/**`,
    `${paths.icon}/**`,
    `${paths.theme}/**`,
    `${paths.constants}/**`,
    ...(paths.routeTypes ? [paths.routeTypes] : []),
  ];

  return [
    {
      name: 'rn-ui-standard/rules',
      files: SOURCE_FILES,
      plugins: { 'react-native': reactNative },
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
            patterns: [
              {
                group: ICON_LIBRARIES,
                message: `Dùng <Icon name="..." /> từ ${imports.icon}.`,
              },
            ],
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
      // Kit and Icon wrap the primitives, so they may import them.
      // Kit và Icon bọc primitive nên được import chúng.
      name: 'rn-ui-standard/kit-and-icon',
      files: [`${paths.kit}/**`, `${paths.icon}/**`],
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
