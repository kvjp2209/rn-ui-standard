---
name: ui-standard
description: Quy chuẩn UI cho dự án React Native dùng Shopify Restyle. Dùng TRƯỚC khi viết màn hình mới, sửa UI cũ, tạo component, hoặc review giao diện. Gồm token semantic, Kit components, quy tắc code, thứ tự import, 4 trạng thái bắt buộc, cấu trúc thư mục và giọng điệu tiếng Việt.
---

# Quy chuẩn UI — React Native + Restyle

## Bước 0 — đọc overlay của dự án

Skill này là **luật chung**. Mọi thứ riêng của từng dự án nằm ở
`docs/ui-standard/project.md` trong repo đang làm: giá trị màu, thang spacing/radius/cỡ
chữ, định hướng thị giác, file mẫu, và **các quyết định có chủ đích**.

1. Đọc `docs/ui-standard/project.md` trước dòng code UI đầu tiên.
2. Không có file đó → dừng lại, báo người dùng, đề nghị tạo từ
   `templates/project.md` của plugin. Đừng tự bịa giá trị token.
3. Xem front matter của overlay: `preset` (`rn-cli` mặc định | `expo-router`) và
   `react-compiler`. Mở `references/conventions.md` để biết alias, thư mục, cách khai kiểu
   route và luật memo của preset đó. Mọi chỗ skill nói "barrel Kit", "module Icon", khối
   `api`/`stores` đều hiểu theo bảng của preset.
4. Overlay **thắng** skill khi hai bên nói khác nhau. Mục "Quyết định có chủ đích" trong
   overlay là đã cân nhắc — **không tự ý "sửa"**.

Chi tiết từng mảng nằm ở `references/` — mở đúng file khi đụng tới mảng đó:

| Việc đang làm | Đọc |
|---|---|
| Alias, thư mục, kiểu route, memo theo preset | `references/conventions.md` |
| Chọn màu, cỡ chữ, spacing, bóng | `references/tokens-typography.md` |
| Viết hoặc sửa khối import | `references/import-order.md` |
| Tạo màn, tách file, đặt tên, memo | `references/structure-naming.md` |
| Màn có tải dữ liệu, nút `disabled` | `references/states.md` |
| Chuỗi hiển thị, i18n | `references/copy-vi.md` |
| Viết test, codemod, gỡ lỗi runtime lạ | `references/pitfalls.md` |

## Luật cốt lõi — kiểm trước khi báo xong

### Token & style

1. **Màu chỉ qua token semantic** (`$cta`, `$surface`, `$textMuted`…), không gọi tên
   palette raw, **cấm hex literal** ngoài file palette. Kể cả trong `StyleSheet`, màu lấy
   qua `useTheme()`.
2. **Chữ chỉ qua `variant` `T<cỡ><độ đậm>`**, cấm `fontSize` hardcode.
3. **Spacing/radius chỉ dùng key có trong theme.** Restyle prop bị TypeScript chặn giá trị
   ngoài thang; `StyleSheet` thì không — nên lệch thang luôn dồn về `StyleSheet`.
4. **Ưu tiên Restyle prop. ≤ 5 style prop thì dùng prop; từ 6 trở lên chuyển
   `StyleSheet`.** `StyleSheet` cũng dành cho thứ Restyle không làm được: `width`,
   `height`, `position`, `transform`, `aspectRatio`.
5. **Style phải qua `StyleSheet.create`**, đặt cuối file sau `export default`. Cấm object
   literal trần (`const s = { alignItems: 'center' as const }`) — phải rắc `as const` là
   dấu hiệu đang làm sai. Giá trị động (safe-area inset…) thì `useMemo` theo đúng biến đó,
   kèm comment vì sao (compiler bật: viết thẳng, compiler tự memo).
6. **BẪY: mọi variant `T*` nướng sẵn `color: '$text'`.** `Text` trên nền `$brand`/`$cta`
   mà không truyền `color` sẽ gần như vô hình. Test không bắt được. **Đổi `variant` thì
   kiểm màu nền khối bao.**

### Component

7. **Dùng Kit, không dùng primitive react-native.** `View` → `Box` · `Text` → Kit `Text` ·
   `Image` → Kit `Image`/`FastImage` · `ScrollView`/`TextInput`/`Pressable` → Kit.
   Ngoại lệ phải có comment lý do tại chỗ (xem `pitfalls.md` — ref, HOC cần View thật).
8. **Icon chỉ qua `<Icon name="..." />`.** Cấm import thư viện icon
   (`react-native-vector-icons`, `@expo/vector-icons`, `lucide-react-native`…) ngoài module
   Icon (`src/components/Icon`). Icon mới: thêm vào union `IconType` **và** `case` trong
   `Icon.tsx`.
   Màu truyền qua prop `color`, không nhét vào `style`. Tên động khai kiểu `IconType`.
9. **`FlashListV2` cho list mới.** Ngoại lệ có lý do (wheel picker cần `snapToInterval` +
   `getItemLayout` chính xác) thì ghi comment.
10. **Vùng nhấn < 44pt phải có `hitSlop`.**

### Code

11. **Thứ tự import 4 tầng + kim tự tháp** — có **bốn** luật con, xem
    `references/import-order.md`. ESLint không bắt được; chạy bộ kiểm tới khi về 0:
    `yarn rn-ui-check-imports <file...>` nếu dự án cài devDependency `rn-ui-standard`, không
    thì `node <plugin>/skills/ui-standard/scripts/check-import-order.mjs <file...>`. Bộ kiểm
    tự đọc `preset` trong overlay.
12. **Không nhồi logic vào JSX.** `? :` lồng nhau, template string ghép ≥ 2 giá trị, `??`
    nối chuỗi → kéo ra biến có tên trước `return`, hoặc xuống `.logic.ts`/presenter.
13. **Không dùng IIFE tính giá trị trong thân component.** Nhánh dựa trên dữ liệu miền
    thuộc `api/<domain>/<domain>.presenter.ts` — trả khoá i18n + tham số, màn chỉ gọi `t()`.
14. **Ngưỡng file: > 250 dòng nên tách, > 400 bắt buộc.** State + handler ra
    `<Màn>.logic.ts` (không JSX), render ở lại `.tsx`. File bảng tra/hằng số được miễn.
15. **Không copy-paste module.** Trùng ≥ 2 nơi mới rút ra `components/` dùng chung.
16. **Kiểu route khai một chỗ, theo router của preset.** React Navigation: khai trong
    `navigation/types.ts`, không ghép `RouteProp` tại màn. Expo Router: file route đọc params
    bằng `useLocalSearchParams<…>()` rồi truyền xuống màn qua props; không truyền object qua
    params. Xem `structure-naming.md`.
17. **memo theo React Compiler của dự án.** Compiler tắt: màn luôn
    `export default memo(Screen)`, component con chỉ `memo` khi prop thật sự ổn định.
    Compiler bật (mặc định của preset `expo-router`, hoặc `react-compiler: true`): không bọc
    `memo`/`useMemo`/`useCallback` thủ công, màn `export default Screen`. Xem
    `structure-naming.md`.

### Trạng thái & chữ

18. **Màn có tải dữ liệu phải đủ 4 trạng thái:** loading → có dữ liệu → rỗng → lỗi. Không
    trạng thái nào rơi vào màn trắng. Xem `references/states.md`.
19. **Không hardcode chuỗi hiển thị.** Key mới có đủ ở mọi file locale. Viết hoa kiểu
    trình bày (ngoại lệ overlay cho phép, vd nhãn nút) làm bằng `textTransform`, chuỗi
    locale giữ dạng câu thường.
20. **Cỡ lớn (`T24B`/`T30B`) chỉ cho thứ người dùng nhìn đầu tiên** — số chủ đạo, số tiền,
    giá. Mặc định lùi về `T16B`–`T18B`. Tiêu đề modal/sheet là `T18B`, không phải cỡ tiêu
    đề màn. **Đừng ánh xạ variant theo tên vai trò** (`metricNumber → T24B` là bẫy).
21. **Khoảng thở trước cỡ chữ.** Hai khối chữ sát nhau chỉ cách 2–4px đọc ra một mảng
    dính. Tăng `gap`/`marginTop` lên nấc 4–8 trước khi nghĩ tới thu nhỏ chữ.

## Phong cách thị giác

Định hướng cụ thể nằm ở overlay. Dù định hướng là gì, **tránh dấu hiệu UI máy sinh**:

- Card lồng trong card lồng trong card
- Thừa pill và tag
- Chữ quá nhỏ, không đọc nổi (dưới 11pt là dưới ngưỡng iOS HIG)
- "Website nhét vào điện thoại" — bố cục web thu nhỏ thay vì bố cục app
- Nhồi quá nhiều nội dung vào màn hình đầu
- Bóng đen thuần nặng nề — bóng lấy sắc từ `$brand`, trần opacity ~0.3
- Gradient tím-xanh mặc định kiểu startup
- Đặt tên theo vai trò bố cục web (`HeroCard`, `HeroSection`) thay vì thực thể miền

## Kỷ luật kiểm chứng

- Kiểm một luật có nhiều luật con thì **liệt kê đủ luật con trước**, rồi mới báo "sạch".
- Viết bộ kiểm tự động và chạy tới khi về 0, đừng kiểm bằng mắt rồi suy rộng.
- Trước khi đặt một quy ước mới, **đếm code có sẵn** xem các file cùng loại đang làm gì.
- Trước khi kết luận "thiếu token/helper X", grep xem X đã có chưa.
- Thứ chỉ lộ khi render thật (màu chữ trên nền đậm, spacing, lồng list) phải xem trên
  simulator/máy thật.

## Review

Nếu máy có cài, dùng kèm `design:design-critique` và `design:accessibility-review`.
