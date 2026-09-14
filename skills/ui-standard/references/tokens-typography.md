# Token, chữ, spacing, elevation

Giá trị cụ thể của mọi token nằm ở `docs/ui-standard/project.md`. File này định nghĩa
**hợp đồng tên** và **cách chọn**.

## Màu — bộ token semantic

| Nhóm | Token | Dùng cho |
|---|---|---|
| Thương hiệu | `$cta` | Nút chính, badge nổi bật |
| | `$ctaSoft` | Nhấn nhẹ, badge phụ |
| | `$brand` | Header, navbar, card nền đậm |
| | `$accent` | Icon đang chọn, link |
| Nền | `$canvas` | Nền màn hình |
| | `$surface` | Nền card, bottom sheet |
| | `$surfaceSoft` | Card phụ, nền tag |
| | `$surfaceInput` | Nền ô nhập, nền section |
| Chữ | `$text` | Chữ chính |
| | `$textMuted` | Chữ phụ, mô tả |
| | `$textSecondary` | Chữ phụ đậm, contrast cao |
| | `$textPlaceholder` | Chữ gợi ý trong input — **không dùng cho nhãn** |
| Trên nền đậm | `$textOnBrand` | Số liệu, tiêu đề trên nền `$brand`/`$cta` |
| | `$textOnBrandMuted` | Overline, chú thích trên nền đậm |
| | `$trackOnBrand` | Nền thanh tiến độ & chip trên nền đậm |
| Viền | `$border` | Viền mặc định, đường kẻ |
| | `$borderStrong` | Viền nhấn, ô đang focus |
| Trạng thái | `$danger` / `$success` / `$warning` | Lỗi / thành công / cảnh báo |
| Lớp phủ | `$overlay` | Nền mờ sau modal |

Cách đặt trong `themes/light.ts`: `colors: { ...palette, $cta: palette.<tên>, … }` — token
semantic trỏ vào palette raw, code ứng dụng chỉ gọi token.

### Luật chọn màu

- **Ba tầng chữ trên nền thương hiệu:** `$textOnBrand` → `$textOnBrandMuted` →
  `$trackOnBrand`. Để tất cả cùng trắng thì thẻ mất phân tầng, đọc ra một khối phẳng.
- **`$textPlaceholder` không dùng cho nhãn.** Xám placeholder vốn được chọn để trông như ô
  chưa điền, ở cỡ nhỏ thường trượt WCAG AA (4.5:1). Nhãn phụ dùng `$textMuted`.
- **`$warning` thường là màu vàng — không làm màu chữ trên nền sáng.** Nhãn cảnh báo dùng
  màu chữ thường, giữ `$warning` cho icon/chấm đi kèm.
- Cần sắc mờ trên nền đậm → dùng token màu có alpha (`$trackOnBrand`), **đừng** bọc `Box`
  + `opacity` vì opacity làm nhạt lây cả nội dung bên trong.
- Chưa có token hợp vai → grep palette trước (thường đã có giá trị chờ sẵn), rồi thêm
  token semantic trỏ vào đó. Không gọi thẳng palette raw trong màn.

## Chữ — `T<cỡ><độ đậm>`

Độ đậm: `R`=400 · `M`=500 · `SB`=600 · `B`=700. Thang cỡ lấy từ overlay.

| Variant | Dùng cho |
|---|---|
| `T12R` | Chữ phụ, timestamp |
| `T12B` | Nhãn tag, badge |
| `T14R` | Nội dung chính (dùng nhiều nhất) |
| `T14B` | Tiêu đề dòng, tên mục |
| `T16B` | Tiêu đề card, nhãn nút |
| `T18B` | Tiêu đề mục lớn, tiêu đề modal/sheet |
| `T24B` | Tiêu đề **màn hình**, số chủ đạo của màn |
| `T30B` | Con số nổi bật nhất, màn chào |

- **Hai cỡ chủ đạo từ 16 đổ xuống.** Khi mọi thứ đều to thì không còn gì nổi.
- **Đừng dịch tên vai trò sang tên variant.** Hỏi "cỡ này có hợp vai trò thật không?":
  `overline → T8B` cho ra 8px không đọc nổi; overline hợp lý thường là `T12B`.
- Không thêm alias semantic (`body`, `caption`) song song với `T*` — hai hệ tên cùng lúc
  là nguồn trôi.
- Kit `Text` đặt mặc định `maxFontSizeMultiplier` (giá trị ở overline) để layout không vỡ
  khi người dùng phóng chữ hệ thống.
- `lineHeight` trong `textVariants`: **xem mục quyết định của overlay.** Tiếng Việt có dấu
  chồng hai tầng (`ế`, `ộ`, `ữ`); hệ số mặc định ~1.2 của RN có thể cắt dấu, rõ nhất trên
  Android.
- Font hệ thống trừ khi overlay nói khác. `fontFamily` riêng phải khai fallback theo nền
  tảng (`Platform.select`) — font không tồn tại trên Android sẽ âm thầm rơi về Roboto.

## Spacing & radius

- Chỉ dùng key có trong `spacing` / `borderRadii` của theme. Không thêm giá trị lẻ vào
  thang; nắn về nấc gần nhất.
- `borderRadii.full` (9999) để vẽ hình tròn/pill có chủ đích — không dùng mẹo
  `borderRadius: 100`.
- Radius **không** mang tên vai trò (`card`, `chip`, `hero`). Chỉ thang số + `full`.
- `gap` trên `Box` nhận key spacing, không phải `number` tuỳ ý.

## Elevation

`shadowVariants`: `raised` (card trên canvas) · `floating` (FAB, sheet) · `overlay`
(modal, popup). Buộc dùng `StyleSheet` thì `commonStyles.shadowRaised` /
`shadowFloating` / `shadowOverlay`. Không tự viết `elevation`/`shadowOpacity` lẻ.

Gợi ý giá trị khởi đầu: opacity 0.10 / 0.18 / 0.30, elevation Android 3 / 8 / 16,
`shadowColor` lấy từ màu thương hiệu.
