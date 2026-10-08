# i18n & giọng điệu tiếng Việt

## Kỷ luật i18n

- **Không hardcode chuỗi hiển thị.** `useTranslation()` trong component, `i18n.t()` ngoài
  React (store, service).
- **Mọi key mới có đủ ở mọi file locale** (`en.ts`, `vi.ts`…).
- Nhánh chọn chuỗi theo dữ liệu miền → presenter trả `{ key, params }`, màn gọi `t()`.
- Chuỗi hiển thị không bao giờ nằm trong comment như một cách "tạm".

## Đặt tên key

Key ghi **đủ nguyên văn bản tiếng Anh**, để ai cũng tìm ra và dùng lại được theo đúng điều
chuỗi đó nói. Key viết tắt hay gắn đuôi vị trí không nói chuỗi là gì, nên về sau không ai
dùng lại được.

1. **Phẳng, một tầng.** Không nhóm lồng (`menu.packages`, `tabs.today`), không tiền tố màn
   hay tính năng (`login_…`, `settings_…`).
2. **Key = toàn bộ bản tiếng Anh dạng snake_case**, đủ mọi từ, đúng thứ tự: chữ thường;
   `{{param}}` thành tên param; `&` thành `and`; bỏ dấu nháy; mọi cụm ký tự khác `[a-z0-9]`
   thành `_`; bỏ `_` ở hai đầu. Câu dài hay đoạn nhiều câu cũng vậy: key ghi hết.
3. **Cấm** đuôi vị trí (`_title`, `_desc`, `_hint`, `_note`, `_reason`, `_label`,
   `_subtitle`, `_body`) và dạng rút gọn của một chuỗi dài hơn.
4. **Đổi chữ tiếng Anh thì đổi key theo**, ở mọi chỗ gọi. Một chuỗi tiếng Anh là một key,
   dùng chung cho mọi màn. Ngôn ngữ khác cần hai cách nói cho cùng một chuỗi tiếng Anh thì
   sửa bản tiếng Anh cho khác nhau (`activity_schedule: 'Activity schedule'` bên cạnh
   `schedule: 'Schedule'`), không thêm đuôi để tách.
5. **Chỉ chuỗi không phải chữ tiếng Anh** mới có key nói nó là gì: giá trị mẫu
   (`example_email: 'name@example.com'`), ký hiệu (`no_value: '—'`), tên ngôn ngữ viết bằng
   chính nó (`vietnamese: 'Tiếng Việt'`). Test liệt kê đích danh các key này.
6. **Nhãn chọn theo enum đi qua bảng map viết rõ**
   (`{ PAID: 'paid', REFUNDED: 'refunded' } as const satisfies Record<OrderStatus, string>`),
   không ghép key từ giá trị enum (`` t(`status_${status}`) ``): key ghép không grep được,
   `tsc` không kiểm được, và không phải nguyên văn tiếng Anh.

| Chuỗi tiếng Anh | Sai | Đúng |
|---|---|---|
| 'Sign out of this device?' | `sign_out_confirm_title`, `profile.sign_out.title` | `sign_out_of_this_device` |
| 'Try again' | `retry` | `try_again` |
| 'Sign in' | `login` | `sign_in` |
| 'Orders placed today and who paid for them' | `orders_hint`, `menu.orders_hint` | `orders_placed_today_and_who_paid_for_them` |
| '{{count}} orders' | `order_count` | `count_orders` |
| 'Products & stock' | `products_stock` | `products_and_stock` |
| "The shop's stock per product" | `shop_stock_desc` | `the_shops_stock_per_product` |
| 'Version {{number}}' | `app_version` | `version_number` |

**Khoá bằng test:** copy `templates/locale-keys.test.ts` vào `src/locale/__tests__/` và điền
`NOT_PROSE` theo dự án. Test báo từng key sai kèm key đúng
(`orders_hint → orders_placed_today_and_who_paid_for_them`).

Dự án đang có file locale kiểu cũ (key lồng, key viết tắt): luật áp cho mọi key mới. Test thứ
hai và thứ ba sẽ báo key cũ cho tới khi đổi hết, nên chỉ bật chúng khi file locale đã sạch.

## Giọng điệu

**Không bê nguyên luật copy tiếng Anh vào.** Tài liệu UX tiếng Anh thường bảo bỏ dấu chấm
than và bỏ "Oops!". Tiếng Việt không vận hành như vậy: `Rất tiếc` là dấu hiệu lịch sự,
tiểu từ `nhé` là chuẩn giao tiếp thân thiện. Bỏ đi làm câu cộc lốc, không giống người Việt
viết.

- Xưng hô nhất quán — mặc định **"bạn"** (overlay có thể đổi).
- Lỗi: nói rõ chuyện gì xảy ra **+** cách xử lý. Giữ "Rất tiếc" khi lỗi không do người dùng.
- Chấm than cho lời chào/chúc mừng, **không** cho lỗi kỹ thuật.
- Không viết hoa Title Case trong câu chữ. Câu ngắn, chủ động.
- **Hoa/thường là trình bày, không phải nội dung.** Overlay chốt ngoại lệ viết hoa (vd
  nhãn nút CTA viết hoa chữ đầu mỗi từ: "Lưu Thay Đổi") thì làm bằng
  `textTransform="capitalize"` trên Kit `Text`; chuỗi trong file locale vẫn viết dạng câu
  thường ("Lưu thay đổi"), đừng gõ hoa sẵn. Một key thường được dùng lại ngoài nút (toast,
  tiêu đề) — gõ hoa sẵn là Title Case rò sang những chỗ đó, và đổi ý phải sửa từng chuỗi ở
  mọi locale thay vì một prop.
- Giữ tiểu từ (`nhé`, `nha`, `Rất tiếc`) nơi phù hợp ngữ cảnh.

| Tránh | Nên |
|---|---|
| `Lỗi mạng!` | `Không kết nối được. Bạn kiểm tra mạng rồi thử lại nhé.` |
| `Thao Tác Thành Công` | `Đã lưu thay đổi` |
| `Error 500` | `Rất tiếc, hệ thống đang gặp sự cố. Bạn thử lại sau ít phút nhé.` |
