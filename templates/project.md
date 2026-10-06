---
preset: rn-cli
---

# Overlay UI của dự án

> Front matter: `preset` là `rn-cli` (React Native CLI, alias `@components`…) hoặc
> `expo-router` (Expo Router, alias `@/…`). `react-compiler` là khoá tuỳ chọn: không có thì lấy
> mặc định của preset (`rn-cli` là `false`, `expo-router` là `true`); chỉ thêm khi dự án khác
> mặc định, và khi có thì nó thắng mặc định của preset. Bộ kiểm import đọc `preset` trong front
> matter; factory ESLint nhận preset qua tham số `uiStandard({ preset })` — đặt cùng giá trị
> với front matter; skill đọc cả `preset` lẫn `react-compiler`. Bảng map ở
> `references/conventions.md` của skill.
>
> Copy file này vào `docs/ui-standard/project.md` của dự án rồi điền. Skill
> `rn-ui-standard:ui-standard` đọc file này trước khi viết UI, và **overlay thắng skill**
> khi hai bên nói khác nhau.
>
> Mọi chỗ `<…>` là phải điền. Xoá dòng hướng dẫn trích dẫn (`>`) khi điền xong.

## 1. Giá trị token màu

> Hợp đồng tên nằm trong skill (`references/tokens-typography.md`). Ở đây chỉ ghi token
> trỏ vào key palette nào. Không dùng token nào thì ghi `—` và lý do.

| Token | Key palette | Giá trị | Ghi chú |
|---|---|---|---|
| `$cta` | `<key>` | `<#hex>` | |
| `$ctaSoft` | `<key>` | `<#hex>` | |
| `$brand` | `<key>` | `<#hex>` | |
| `$accent` | `<key>` | `<#hex>` | |
| `$canvas` | `<key>` | `<#hex>` | |
| `$surface` | `<key>` | `<#hex>` | |
| `$surfaceSoft` | `<key>` | `<#hex>` | |
| `$surfaceInput` | `<key>` | `<#hex>` | |
| `$text` | `<key>` | `<#hex>` | |
| `$textMuted` | `<key>` | `<#hex>` | cần ≥ 4.5:1 trên `$surface` |
| `$textSecondary` | `<key>` | `<#hex>` | |
| `$textPlaceholder` | `<key>` | `<#hex>` | |
| `$textOnBrand` | `<key>` | `<#hex>` | |
| `$textOnBrandMuted` | `<key>` | `<#hex>` | |
| `$trackOnBrand` | `<key>` | `<rgba>` | |
| `$border` | `<key>` | `<#hex>` | |
| `$borderStrong` | `<key>` | `<#hex>` | |
| `$danger` | `<key>` | `<#hex>` | |
| `$success` | `<key>` | `<#hex>` | |
| `$warning` | `<key>` | `<#hex>` | |
| `$overlay` | `<key>` | `<rgba>` | |

Tương phản đã đo (WCAG AA: chữ thường 4.5:1, chữ lớn & UI 3:1):

| Cặp | Tỉ lệ | Kết luận |
|---|---|---|
| `$textOnBrand` trên `$cta` | `<x.xx>` | |
| `$textMuted` trên `$surface` | `<x.xx>` | |

## 2. Thang

- **Spacing:** `<0 2 4 6 8 12 16 24 32 48 …>`
- **Radius:** `<0 4 6 8 12 16 24 48 …> full`
- **Cỡ chữ:** `<12 14 16 18 24 30>` × `R M SB B`
- **Cỡ nhỏ nhất:** `<12>` — dưới 11pt là dưới ngưỡng iOS HIG
- **`maxFontSizeMultiplier` mặc định của Kit `Text`:** `<1.3>`
- **Elevation:** `raised` `<0.10 / 3>` · `floating` `<0.18 / 8>` · `overlay` `<0.30 / 16>`
- **Font:** `<hệ thống | tên font + fallback Android>`

## 3. Định hướng thị giác

> Viết 3–6 dòng đủ cụ thể để agent tự quyết được. Trả lời: người dùng là ai, màn hình có
> dùng cho truyền thông không, giàu hay tối giản, thứ gì phải nổi nhất trên màn.

- Người dùng: `<…>`
- Hướng: `<…>`
- Bias theo loại app: `<…>`
- Không muốn: `<…>`
- Ảnh tham chiếu người dùng gửi được hiểu là `<cấu trúc & phong cách | cả bảng màu>`

## 4. Giọng điệu

- Xưng hô: `<bạn>`
- Ngoại lệ copy đã chốt: `<chuỗi nào giữ nguyên dù trái luật chung>`
- Ngoại lệ viết hoa: `<không | nhãn nút … viết hoa chữ đầu mỗi từ qua textTransform="capitalize">`

## 5. File mẫu chuẩn

> Agent mở những file này để bắt chước. Chọn file ĐÃ đạt chuẩn, không chọn file đang nợ.

| Mẫu cho | Đường dẫn |
|---|---|
| Màn tách `.tsx` + `.logic.ts` + `components/` | `<src/screens/…>` |
| Khối import chuẩn | `<…>` |
| Import nhiều dòng xen kẽ một dòng | `<…>` |
| Module UI dùng chung ≥ 2 màn | `<src/components/…>` |
| Presenter miền | `<src/api/…/….presenter.ts>` |
| Skeleton của một màn | `<…/skeletons/…>` |
| Store có trường `error` | `<src/stores/…>` |
| Kiểu route | `src/navigation/types.ts` (rn-cli) \| file route trong `src/app/` (expo-router) |

## 6. Kit & component dùng chung của dự án

> Liệt kê thêm ngoài bộ cơ bản (`Box`, `Text`, `Pressable`, `ScrollView`, `TextInput`,
> `Image`, `FastImage`, `FlashListV2`, `Skeleton*`, `Icon`, `ListEmpty`, `LoadingView`).

| Component | Dùng cho |
|---|---|
| `<…>` | `<…>` |

## 7. Quyết định có chủ đích

> Thứ trông như thiếu sót nhưng đã cân nhắc. Agent **không tự ý đổi**. Mỗi dòng có rủi ro
> còn lại để sau này mở lại không phải bàn lại từ đầu. Các dòng dưới là câu hỏi mà mọi dự
> án phải trả lời — chọn rồi xoá phương án không dùng.

| # | Quyết định | Chọn | Lý do | Rủi ro còn lại |
|---|---|---|---|---|
| D1 | `lineHeight` trong `textVariants` | `<có (hệ số …) \| không>` | | Không có: dấu tiếng Việt ở chữ nhỏ có thể bị cắt trên Android |
| D2 | Phản hồi khi nhấn mặc định trong Kit `Pressable` | `<opacity … \| scale … \| không>` | | Không có: nút không phản hồi thị giác |
| D3 | `accessibilityRole`/`Label`/`State` | `<bắt buộc từ đầu \| hoãn>` | | Hoãn: trình đọc màn hình đọc "nút, nút, nút" |
| D4 | Chữ trên nút `$cta` | `<chữ sáng \| chữ tối>` | | Ghi tỉ lệ tương phản thực tế |
| D5 | Enforcement tự động | `<eslint + lint-staged \| chỉ skill>` | | Chỉ skill: không gì chặn khi agent/dev quên |
| D6 | File miễn ngưỡng dòng | `<danh sách>` | bảng tra / hằng số | |
| D7 | Ngoại lệ dùng primitive react-native | `<file: lý do>` | | |

## 8. Quy ước riêng khác

- Comment: `<một ngôn ngữ | song ngữ Anh trước Việt sau>`
- `<…>`
