# Preset — alias, thư mục, kiểu route, memo

Dự án chọn preset ở front matter của `docs/ui-standard/project.md`:

```md
---
preset: expo-router
react-compiler: true
---
```

Không có front matter → `rn-cli` (khuôn mặc định, y như bản 1.1). Bộ kiểm import và factory
ESLint đọc `preset`; skill đọc cả `preset` lẫn `react-compiler`. Giá trị máy đọc nằm ở
`presets/<preset>.json` của plugin.

## Bảng map

| Vai trò | `rn-cli` | `expo-router` |
|---|---|---|
| Barrel Kit | `@components/Kit` | `@/components/Kit` |
| Module Icon | `@components/Icon` | `@/components/Icon` |
| Theme | `@theme` | `@/theme` |
| API miền | `@api/<domain>/…` | `@/api/<domain>/…` |
| Store | `@stores/<domain>` | `@/stores/<domain>` |
| Màn khác | `@src/screens/<Màn>` | `@/screens/<Màn>` |
| Hook chung | `@src/hooks/…` | `@/hooks/…` |
| Thư mục Kit / Icon / theme | `src/components/Kit` · `src/components/Icon` · `src/theme` | như bên trái |
| Thư mục màn | `src/screens/<Màn>/` | như bên trái |
| Đặt tên thư mục & component | PascalCase | PascalCase |
| Router | React Navigation | Expo Router |
| Kiểu route (luật 16) | `src/navigation/types.ts` | params đọc ở file route trong `src/app/` |
| React Compiler (luật 17) | tắt | bật |

Trong `presets/<preset>.json`, code chỉ đọc `importTiers` (bộ kiểm import) và `imports` + `paths`
(factory ESLint); `name`, `router`, `reactCompiler` là giá trị mặc định để tra cứu.

`react-compiler` trong front matter thắng giá trị mặc định của preset — dự án Expo tắt
compiler thì ghi `react-compiler: false` và theo luật memo bản thường.

## Tầng import

| Tầng | `rn-cli` | `expo-router` |
|---|---|---|
| 1 | `react`, `react-native`, `@components/Kit` | `react`, `react-native`, `@/components/Kit` |
| 2 | thư viện bên thứ ba | thư viện bên thứ ba (kể cả `expo-*`) |
| 3 | `@app` `@assets` `@components` `@constants` `@hooks` `@libs` `@locale` `@modules` `@navigation` `@theme` `@utils` `@src` (bắt mọi `@src/…` còn lại) | `@/assets` `@/components` `@/constants` `@/hooks` `@/libs` `@/locale` `@/theme` `@/utils` `@` (bắt mọi `@/…` còn lại) |
| khối api | `@api` | `@/api` |
| khối stores | `@stores` | `@/stores` |
| 4 | `./…` `../…` `@src/screens` | `./…` `../…` `@/screens` |

## Expo Router — thứ không có ở khuôn React Navigation

- `src/app/` **chỉ chứa route**: mọi file ở đó là một màn của router, `_layout.tsx` định nghĩa
  navigator. Component, hook, utils nằm ngoài `src/app/`.
- File route đặt tên **viết thường** vì là URL (`index.tsx`, `[orderId].tsx`, `(tabs)/`) — ngoại lệ
  duy nhất của luật PascalCase.
- File route chỉ lo việc của route (đọc params, tuỳ chọn header) rồi render màn từ
  `src/screens/<Màn>`.
