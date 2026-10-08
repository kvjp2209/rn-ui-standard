# Bẫy đã gặp — Restyle, test, codemod, runtime

## Restyle & Kit

- **Kit `Text` không nhận prop layout** (`flex`, …) — `createText` chỉ gồm nhóm
  typography/spacing/color. Cần `flex` thì bọc `Box`.
- **Component dựng bằng `createBox` không forward ref.** Đổi `ScrollView` react-native có
  `scrollRef.current?.scrollToEnd()` sang Kit sẽ làm ref rỗng, auto-scroll chết không báo
  lỗi. Giữ bản react-native, ghi comment lý do tại chỗ.
- HOC của thư viện bên thứ ba cần `View` thật để đo hoặc gắn ref → giữ `View`, ghi
  comment.
- **Variant `T*` nướng sẵn `color: '$text'`** — xem SKILL.md luật 6.
- `Icon` bọc trong `Box` nên `style` là `ViewStyle`: màu qua prop `color`.
- **Tên icon trùng giữa hai thư viện:** `IconType` là không gian tên phẳng, phân biệt bằng
  hậu tố `-ion` (Ionicons), `-mi` (MaterialIcons), `-fontisto`, `-entypo`, `-feather`.
- **Kiểm `case` trong `Icon.tsx` trước khi dùng lại một tên** — `chevron-right` có thể
  render bằng Feather trong khi màn đang dùng Ionicons; hai trạng thái của cùng một nút
  gạt mà khác bộ icon thì nét vẽ nhảy khi bấm.
- Kit component theo mẫu `index.ts` re-export `Name.tsx`: **kiểm cấu trúc thư mục trước
  khi ghi đè**. Tạo `index.tsx` mới ở đó thành file mồ côi — app dùng file cũ, test vẫn
  xanh vì import nhầm chỗ.

## Test

- Import barrel Kit trong test có thể kéo thư viện điều hướng dạng ESM
  (`@react-navigation/native`) và làm jest chết (`SyntaxError: Unexpected token 'export'`).
  Hoặc cấu hình `transformIgnorePatterns` ngay từ đầu dự án (preset `jest-expo` đã làm sẵn cho
  hệ Expo), hoặc import sâu (`<barrel Kit>/Box`) / `import type` trong test.
- Component dùng Reanimated khó render trong jest nếu chưa cấu hình. Tách logic thuần ra
  `*.helpers.ts` rồi test file đó; phần render verify trên simulator.
- **Test theme khoá tên, không chỉ khoá giá trị.** Test chỉ kiểm tên variant không bắt được
  chữ đen trên nền đậm — thứ đó chỉ lộ khi nhìn màn thật.
- Biến quyết định có chủ đích thành test (vd "Kit `Pressable` không tự mờ khi `disabled`")
  thay vì chỉ là một dòng comment.
- Dự án không có `@types/node` thì đừng dùng `fs`, `path`, `__dirname` trong test.

## Codemod

- macOS: **dùng `perl -pi -e`, không dùng `sed`** — BSD sed không hỗ trợ `\b`, âm thầm
  không đổi gì.
- Thay chuỗi bằng biểu thức: **thuộc tính JSX cần ngoặc nhọn** (`color="#fff"` →
  `color={palette.white}`); trong `StyleSheet` thì không.
- File đặt bí danh cho vector-icons (`import Ionicons from …`): đổi `<Ionicons>` → `<Icon>`
  mà quên dòng import thì script tưởng chưa sửa gì. Đổi thủ công.
- **Cấm codemod hàng loạt khi ánh xạ không 1-1** — token trùng tên khác giá trị, một token
  cũ ra hai đích tuỳ ngữ cảnh, hay thay đổi cấu trúc JSX. Làm từng file.
- Chừa `__tests__` khi codemod tên token.
- Regex quét code phải tự kiểm trên vài mẫu thật trước khi tin con số: `^\s+Text,$` khớp cả
  dòng trong khối import nhiều dòng của Kit; quét `<X name="literal">` một dòng bỏ sót tên
  nhiều dòng, tên động, tên truyền qua prop.

## i18n

- Đừng ghép key lúc chạy (`t(\`status_${s}\`)`): grep không thấy, `tsc` không kiểm được.
  Dùng bảng map viết rõ (`copy-vi.md`, luật 6). Code cũ còn key ghép thì đừng xoá "key
  thừa" dựa trên quét chuỗi.
- Chuỗi nội suy chứa ngày tháng có `/` bị escape HTML nếu `interpolation.escapeValue` bật —
  React Native không cần escape, nên tắt.

## Runtime

- Thêm asset **SVG mới** giữa phiên làm hot-reload gãy
  (`Cannot read property 'displayName' of undefined`) → khởi động lại app.
- **Dời/đổi tên file hàng loạt khi Metro đang chạy** cho `Render Error: Object is not a
  function` với stack toàn frame nội bộ React → nạp lại app hoàn toàn rồi mới kết luận.
- Lồng `FlatList`/wheel picker trong `ScrollView` cùng chiều dọc: chỉ lộ khi render thật.
