# rn-ui-standard

Quy chuẩn UI dùng chung cho các dự án React Native dùng Shopify Restyle, đóng gói thành
Claude Code plugin — kèm preset theo khuôn dự án, factory ESLint và bộ kiểm thứ tự import cài
được như một devDependency.

Repo chỉ chứa **luật chung**. Mọi thứ riêng của một dự án (giá trị màu, định hướng thị
giác, file mẫu, quyết định có chủ đích) nằm trong **overlay** của chính dự án đó.

## Nội dung

```
.claude-plugin/          plugin.json + marketplace.json
skills/ui-standard/
  SKILL.md               luật cốt lõi, trỏ tới references
  references/            preset, token, import, cấu trúc, trạng thái, copy tiếng Việt, bẫy
  scripts/               check-import-order.mjs (CLI) + import-order-lib.mjs (logic)
hooks/                   nhắc nạp skill ở lần ghi .tsx đầu tiên (chỉ khi repo có overlay)
presets/                 rn-cli.json, expo-router.json — alias, thư mục, tầng import
eslint/                  factory flat config uiStandard({ preset })
templates/
  project.md             overlay để copy vào dự án
  eslint-ui-rules.js     luật ESLint cho dự án .eslintrc chưa cài devDependency
  theme-contract.test.ts khoá hợp đồng tên token
tests/                   node --test cho preset, bộ kiểm import, factory ESLint và đồng bộ version
```

## Preset

| Preset | Khuôn | Alias | Router | React Compiler |
|---|---|---|---|---|
| `rn-cli` (mặc định) | React Native CLI | `@components`, `@theme`, `@api`, `@stores`, `@src`… | React Navigation | tắt |
| `expo-router` | Expo | `@/components`, `@/theme`, `@/api`, `@/stores`, `@/screens`… | Expo Router | bật |

Cả hai giả định cùng cấu trúc thư mục: `src/screens/<Màn>/`, `src/components/Kit/`,
`src/components/Icon/`, `src/theme/themes/light.ts`, `src/api/<domain>/`, `src/stores/`; đặt
tên thư mục và component PascalCase. Chi tiết: `skills/ui-standard/references/conventions.md`.
Dự án không khai preset được coi là `rn-cli` — hành vi y như bản 1.1.

## Cài vào một dự án

**1. Bật plugin cho cả team** — chạy ở thư mục gốc dự án, CLI tự ghi
`.claude/settings.json` (commit file đó):

```bash
claude plugin marketplace add https://github.com/kvjp2209/rn-ui-standard --scope project
claude plugin install rn-ui-standard@rn-ui-standard --scope project
```

Với đường dẫn local, CLI ghi `"source": { "source": "directory", "path": "…" }` — chỉ đúng
trên máy đó. Dùng git URL để cả team dùng được.

**2. Tạo overlay:** copy `templates/project.md` → `docs/ui-standard/project.md`, đặt
`preset` / `react-compiler` ở front matter, điền phần còn lại.

**3. Trỏ từ `CLAUDE.md` của dự án:**

```md
## Trước khi viết UI
Nạp skill `rn-ui-standard:ui-standard` và đọc `docs/ui-standard/project.md` TRƯỚC dòng
code UI đầu tiên.
```

**4. Cài phần máy kiểm được làm devDependency** (ghim tag):

```bash
yarn add -D github:kvjp2209/rn-ui-standard#v1.2.0 eslint@^9
```

`eslint.config.js` (flat config):

```js
const uiStandard = require('rn-ui-standard/eslint');

module.exports = defineConfig([
  // …config sẵn có của dự án
  uiStandard({ preset: 'expo-router' }),
]);
```

`package.json`:

```json
"scripts": {
  "lint:imports": "rn-ui-check-imports src"
}
```

Dự án `.eslintrc` (ESLint 8) không cài devDependency thì gộp `templates/eslint-ui-rules.js`
vào `.eslintrc.js` như bản 1.1.

**5. Tuỳ chọn:** copy `templates/theme-contract.test.ts` vào `src/theme/__tests__/`, đặt
`SIZES` / `RADII` theo overlay.

Nếu dự án đang có skill UI riêng trong `.claude/skills/`, gỡ nó sau khi overlay đã đủ để
tránh hai nguồn luật.

## Kiểm thứ tự import

```bash
yarn rn-ui-check-imports src                                              # có devDependency
node <đường-dẫn-plugin>/skills/ui-standard/scripts/check-import-order.mjs src  # không có
```

Bộ kiểm chọn tầng theo thứ tự `--config tiers.json` > `--preset <tên>` > `preset` trong front
matter của `docs/ui-standard/project.md` (tính từ thư mục đang chạy) > `rn-cli`. Hai cờ nhận cả
dạng `--preset=<tên>` lẫn `--config=<file>`; dòng `preset:` ở front matter có thể đặt trong nháy
hoặc kèm chú thích `# …` cuối dòng.

Mã thoát: `0` sạch, `1` còn vi phạm (dùng được trong lint-staged/CI), `2` lỗi cách dùng — tham
số sai, preset không tồn tại, front matter hoặc `--config` hỏng, đường dẫn không có.

## ESLint 9

Factory dùng `eslint-plugin-react-native` 5, plugin này gọi API đã bị gỡ ở ESLint 10
(`context.getSourceCode`). Dự án ghim `eslint@^9` cho tới khi có bản thay thế.

Factory đăng ký plugin `react-native` cho mọi file, nên dùng luật `react-native/*` ở đâu cũng
được. Đừng đăng ký thêm một bản plugin khác — ESLint báo `Cannot redefine plugin "react-native"`.

Flat config thay nguyên options của một luật ở object đứng sau. Dự án tự đặt
`no-restricted-imports` / `no-restricted-syntax` cho `src/**` sẽ thay mất options của factory;
muốn thêm hạn chế riêng thì đặt ở object có `files` khác, không trùng `src/**`.

Glob của factory tính từ thư mục chứa `eslint.config.js` — chạy ESLint từ gốc dự án.

## Phát triển plugin

```bash
npm install
npm test
claude plugin validate .
```

## Đóng góp luật mới

Luật học được ở một dự án chỉ vào repo này khi:

1. Áp được cho **mọi** dự án cùng khuôn — không thì nó thuộc overlay của dự án đó.
2. **Không mang dấu vết dự án nguồn:** không tên sản phẩm, không thực thể miền, không mã
   màu, không đường dẫn file cụ thể, không số liệu đo, không ngày tháng hay lịch sử migrate.
   Ví dụ minh hoạ dùng thực thể trung tính (`Order`, `Profile`).
3. Kèm **lý do** (vì sao) ngắn gọn, không kèm câu chuyện.

Tăng `version` trong `.claude-plugin/plugin.json`, `marketplace.json` và `package.json` mỗi
lần phát hành, rồi gắn tag `v<version>`.
