# i18n & giọng điệu tiếng Việt

## Kỷ luật i18n

- **Không hardcode chuỗi hiển thị.** `useTranslation()` trong component, `i18n.t()` ngoài
  React (store, service).
- **Mọi key mới có đủ ở mọi file locale** (`en.ts`, `vi.ts`…).
- Key ngắn → `snake_case` (`phone_number`, `go_back`).
- Key dài → cả câu tiếng Anh làm key (`create_a_new_account`).
- **Key khớp nghĩa của giá trị.** Không prefix namespace kiểu `screen_x_title`.
- Nhánh chọn chuỗi theo dữ liệu miền → presenter trả `{ key, params }`, màn gọi `t()`.
- Chuỗi hiển thị không bao giờ nằm trong comment như một cách "tạm".

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
