/**
 * ESLint rules that enforce the machine-checkable part of ui-standard.
 * Merge into the project's .eslintrc.js: spread `rules` and append `overrides`.
 * Not enforceable here: ≤5-prop threshold, 4 data states, hitSlop, import pyramid
 * (use scripts/check-import-order.mjs for the last one).
 *
 * Luật ESLint cho phần máy kiểm được của ui-standard.
 * Gộp vào .eslintrc.js của dự án: trải `rules`, nối thêm `overrides`.
 * Không chặn được ở đây: ngưỡng 5 prop, 4 trạng thái, hitSlop, kim tự tháp import
 * (cái cuối dùng scripts/check-import-order.mjs).
 */
const HEX_LITERAL = "Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]";

module.exports = {
  rules: {
    'react-native/no-color-literals': 'error',
    'react-native/no-inline-styles': 'error',
    'react-native/no-unused-styles': 'error',
    'react-hooks/exhaustive-deps': 'error',

    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react-native',
            importNames: ['View', 'Text', 'Image', 'ScrollView', 'TextInput', 'Pressable'],
            message: 'Dùng Kit (Box, Text, Image, ScrollView, TextInput, Pressable) từ @components/Kit.',
          },
        ],
        patterns: [
          {
            group: ['react-native-vector-icons/*'],
            message: 'Dùng <Icon name="..." /> từ @components/Icon.',
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
      {
        selector: "JSXAttribute[name.name='fontSize']",
        message: 'Cấm fontSize hardcode — dùng variant T<cỡ><độ đậm>.',
      },
      {
        selector: "Property[key.name='fontSize'][value.type='Literal']",
        message: 'Cấm fontSize hardcode — dùng variant T<cỡ><độ đậm>.',
      },
    ],

    'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
  },

  overrides: [
    {
      // Kit and Icon wrap the primitives, so they may import them.
      // Kit và Icon bọc primitive nên được import chúng.
      files: ['src/components/Kit/**', 'src/components/Icon/**'],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      // Palette and theme are where raw values live.
      // Palette và theme là nơi chứa giá trị raw.
      files: ['src/theme/**'],
      rules: { 'react-native/no-color-literals': 'off', 'no-restricted-syntax': 'off' },
    },
    {
      // Lookup tables: length grows with entries, not with branching.
      // Bảng tra: dài theo số mục, không theo số nhánh.
      files: [
        'src/locale/**',
        'src/components/Icon/**',
        'src/theme/**',
        'src/navigation/types.ts',
        'src/constants/**',
      ],
      rules: { 'max-lines': 'off' },
    },
  ],
};
